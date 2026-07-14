<script setup lang="ts">
/**
 * /forms/detail?path=<path> — Form detail view with integrated form builder.
 * Path is the URL-encoded form path (e.g. "bug-report%2Fexample-bug-report").
 */
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';
import VueJsonFormBuilder from '@educorvi/vue-json-form-builder';

definePageMeta({ middleware: ['authenticated'], layout: 'base-layout' });

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;

const formPath = computed(() =>
    decodeURIComponent((route.query.path as string) ?? '')
);

// Fetch form metadata (for header title/breadcrumb)
const {
    data: form,
    error: formError,
    status,
} = useAsyncData(
    `form-detail-${formPath.value}`,
    () => orpc.forms.get({ params: { id: formPath.value } }),
    { watch: [formPath] }
);
const pending = computed(() => status.value === 'pending');

const { isNotFound, hasError, errorMessage } = usePageError(formError, status);

// Fetch schema
const { data: schema } = useAsyncData(
    `form-schema-${formPath.value}`,
    () => orpc.forms.schema.getLatest({ params: { id: formPath.value } }),
    { watch: [formPath] }
);

// Convert to JSON strings for the builder component props
const jsonSchemaString = computed(() => {
    if (!schema.value?.json) return undefined;
    return JSON.stringify(schema.value.json);
});

const uiSchemaString = computed(() => {
    if (!schema.value?.ui) return undefined;
    return JSON.stringify(schema.value.ui);
});

// Breadcrumb (BasePage reads the trail automatically)
const { set: setBreadcrumb } = useAppBreadcrumb();
watch(
    form,
    (f) => {
        if (f) setBreadcrumb('forms', f);
    },
    { immediate: true }
);

function goEdit() {
    router.push(Routes.formsEdit(formPath.value));
}

// Builder expand/collapse toggle (fullscreen overlay)
const builderExpanded = ref(false);

// Debounced save of schema changes
const saveTimer = ref<ReturnType<typeof setTimeout> | null>(null);

async function onSchemasChange(json: any, ui: any) {
    const formId = form.value?.id;
    if (!formId) return;
    if (saveTimer.value) clearTimeout(saveTimer.value);
    saveTimer.value = setTimeout(async () => {
        try {
            await orpc.forms.schema.import({
                params: { id: String(formId) },
                body: { schema: { json, ui } },
            });
        } catch (err: any) {
            console.error('Failed to save schema', err);
        }
    }, 1000);
}
</script>

<template>
    <BasePage
        :title="form?.title || '...'"
        :description="form?.description ?? undefined"
        icon="file-text"
        body-full-width
    >
        <template #actions>
            <BButton
                variant="outline-secondary"
                size="sm"
                v-b-tooltip="
                    builderExpanded ? t('common.collapse') : t('common.expand')
                "
                @click="builderExpanded = !builderExpanded"
            >
                <PhosphorIcon
                    :name="builderExpanded ? 'arrows-in' : 'arrows-out'"
                    :size="14"
                />
            </BButton>
            <BButton variant="outline-secondary" size="sm" @click="goEdit">
                <PhosphorIcon name="pencil" :size="14" class="me-1" />{{
                    t('common.edit')
                }}
            </BButton>
        </template>

        <!-- Error states (inside BasePage body) -->
        <template v-if="hasError">
            <div class="px-4 pt-4">
                <BaseErrorState
                    v-if="isNotFound"
                    icon="warning-circle"
                    :title="t('forms.detail.notFound')"
                    :description="errorMessage"
                    :action-route="Routes.FORMS"
                    :action-label="t('forms.detail.backToForms')"
                />
                <BaseErrorState
                    v-else
                    icon="bug"
                    :title="t('common.errorTitle')"
                    :description="errorMessage"
                    :action-route="Routes.FORMS"
                    :action-label="t('forms.detail.backToForms')"
                />
            </div>
        </template>

        <!-- Form builder (fills remaining height at full width) -->
        <template v-else>
            <template v-if="pending">
                <div class="px-4">
                    <BPlaceholder animation="glow" class="mb-2" width="50%" />
                    <BPlaceholder animation="glow" width="30%" />
                </div>
            </template>
            <template v-else>
                <VueJsonFormBuilder
                    :jsonSchema="jsonSchemaString"
                    :uiSchema="uiSchemaString"
                    hideHeader
                    @vjfb-change="onSchemasChange"
                />
            </template>
        </template>
    </BasePage>

    <!-- Fullscreen builder overlay -->
    <Teleport to="body">
        <div
            v-if="builderExpanded"
            class="position-fixed top-0 start-0 w-100 h-100 bg-body d-flex flex-column"
            style="z-index: 2"
        >
            <div
                class="d-flex justify-content-between align-items-center p-2 flex-shrink-0 border-bottom"
            >
                <span class="fw-semibold ps-2">{{ form?.title || '' }}</span>
                <BButton
                    variant="outline-secondary"
                    size="sm"
                    @click="builderExpanded = false"
                    class="me-2"
                >
                    <PhosphorIcon name="x" :size="14" class="me-1" />{{
                        t('common.close')
                    }}
                </BButton>
            </div>
            <div
                class="flex-grow-1 d-flex flex-column overflow-hidden"
                style="min-height: 0"
            >
                <VueJsonFormBuilder
                    :jsonSchema="jsonSchemaString"
                    :uiSchema="uiSchemaString"
                    hideHeader
                    @vjfb-change="onSchemasChange"
                />
            </div>
        </div>
    </Teleport>
</template>

<style>
/* Prevent the surrounding Nuxt layout from scrolling.
   The form builder component handles its own internal scrolling. */
.d-flex.flex-column.vh-100 > main.overflow-y-auto {
    overflow: hidden !important;
}
</style>
