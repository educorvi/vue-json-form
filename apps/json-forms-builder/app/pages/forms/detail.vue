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

// Breadcrumb
const { set: setBreadcrumb, trail: breadcrumbTrail } = useAppBreadcrumb();
watch(
    form,
    (f) => {
        if (f) setBreadcrumb('forms', f);
    },
    { immediate: true }
);

// Delete modal
const showDeleteModal = ref(false);
const deletePending = ref(false);
const deleteError = ref<string | null>(null);

async function onDeleteConfirm() {
    if (!form.value) return;
    deletePending.value = true;
    deleteError.value = null;
    try {
        await orpc.forms.delete({ params: { id: String(form.value.id) } });
        showDeleteModal.value = false;
        router.push(Routes.FORMS);
    } catch (err: any) {
        deleteError.value = err?.message ?? String(err);
    } finally {
        deletePending.value = false;
    }
}

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
    <div class="d-flex flex-column flex-grow-1" style="min-height: 0">
        <!-- Error states -->
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

        <template v-else>
            <!-- Sticky header: breadcrumb + title + actions -->
            <div
                class="flex-shrink-0 sticky-top bg-body border-bottom"
                style="z-index: 5"
            >
                <!-- Breadcrumb -->
                <div class="px-4 pt-4 pb-2">
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb mb-0 small">
                            <li
                                class="breadcrumb-item d-inline-flex align-items-center"
                            >
                                <NuxtLink
                                    to="/"
                                    class="text-decoration-none d-inline-flex align-items-center gap-1"
                                    :title="t('nav.formBuilder')"
                                >
                                    <i class="bi bi-house-fill" />
                                </NuxtLink>
                            </li>
                            <li
                                v-for="(entry, idx) in breadcrumbTrail"
                                :key="idx"
                                class="breadcrumb-item d-inline-flex align-items-center"
                                :class="{
                                    active: idx === breadcrumbTrail.length - 1,
                                }"
                            >
                                <NuxtLink
                                    v-if="
                                        entry.route &&
                                        idx < breadcrumbTrail.length - 1
                                    "
                                    :to="entry.route"
                                    class="text-decoration-none"
                                >
                                    <span v-if="entry.label">{{
                                        entry.label
                                    }}</span>
                                </NuxtLink>
                                <span
                                    v-else
                                    class="d-inline-flex align-items-center gap-1"
                                >
                                    <span v-if="entry.label">{{
                                        entry.label
                                    }}</span>
                                </span>
                            </li>
                        </ol>
                    </nav>
                </div>

                <!-- Header: title + description + actions -->
                <div
                    class="d-flex flex-column flex-sm-row align-items-start px-4 pb-3 gap-2"
                >
                    <div class="d-flex align-items-center gap-3">
                        <PhosphorIcon
                            name="file-text"
                            :size="28"
                            class="flex-shrink-0 d-none d-md-flex"
                        />
                        <div>
                            <h1 class="h3 fw-bold mb-0">
                                {{ form?.title || '...' }}
                            </h1>
                            <p
                                v-if="form?.description"
                                class="text-secondary mb-0 mt-1"
                            >
                                {{ form.description }}
                            </p>
                        </div>
                    </div>
                    <div
                        v-if="form"
                        class="flex-shrink-0 ms-sm-auto d-flex flex-wrap gap-2"
                    >
                        <BButton
                            variant="outline-secondary"
                            size="sm"
                            v-b-tooltip="
                                builderExpanded
                                    ? t('common.collapse')
                                    : t('common.expand')
                            "
                            @click="builderExpanded = !builderExpanded"
                        >
                            <PhosphorIcon
                                :name="
                                    builderExpanded ? 'arrows-in' : 'arrows-out'
                                "
                                :size="14"
                            />
                        </BButton>
                        <BButton
                            variant="outline-secondary"
                            size="sm"
                            @click="goEdit"
                        >
                            <PhosphorIcon
                                name="pencil"
                                :size="14"
                                class="me-1"
                            />{{ t('common.edit') }}
                        </BButton>
                        <BButton
                            variant="outline-danger"
                            size="sm"
                            @click="showDeleteModal = true"
                        >
                            <PhosphorIcon
                                name="trash"
                                :size="14"
                                class="me-1"
                            />{{ t('forms.delete.title') }}
                        </BButton>
                    </div>
                </div>
            </div>

            <!-- Form builder -->
            <div
                class="flex-grow-1 d-flex flex-column overflow-hidden"
                style="min-height: 0"
            >
                <template v-if="pending">
                    <div class="px-4">
                        <BPlaceholder
                            animation="glow"
                            class="mb-2"
                            width="50%"
                        />
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
            </div>
        </template>

        <!-- Fullscreen builder overlay -->
        <Teleport to="body">
            <div
                v-if="builderExpanded"
                class="position-fixed top-0 start-0 w-100 h-100 bg-body d-flex flex-column"
                style="z-index: 10000"
            >
                <div
                    class="d-flex justify-content-between align-items-center p-2 flex-shrink-0 border-bottom"
                >
                    <span class="fw-semibold ps-2">{{
                        form?.title || ''
                    }}</span>
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

        <!-- Delete modal -->
        <BModal
            v-model="showDeleteModal"
            :title="t('forms.delete.title')"
            ok-variant="danger"
            :ok-title="t('forms.delete.confirm')"
            :cancel-title="t('common.cancel')"
            :ok-disabled="deletePending"
            @ok="onDeleteConfirm"
        >
            <p>{{ t('forms.delete.warning') }}</p>
            <BAlert
                v-if="deleteError"
                variant="danger"
                :dismissible="false"
                class="mb-0"
                >{{ deleteError }}</BAlert
            >
        </BModal>
    </div>
</template>

<style>
/* Prevent the surrounding Nuxt layout from scrolling.
   The form builder component handles its own internal scrolling. */
.d-flex.flex-column.vh-100 > main.overflow-y-auto {
    overflow: hidden !important;
}
</style>
