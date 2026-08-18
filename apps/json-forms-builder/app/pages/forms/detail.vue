<script setup lang="ts">
/**
 * /forms/detail?path=<path> — Form detail view with integrated form builder.
 * Path is the URL-encoded form path (e.g. "bug-report%2Fexample-bug-report").
 */
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';
import VueJsonFormBuilder, {
    type CollabConfig,
} from '@educorvi/vue-json-form-builder';

definePageMeta({ middleware: ['authenticated'], layout: 'base-layout' });

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;
const { user } = useUserSession();
const runtimeConfig = useRuntimeConfig();

// The form builder handles its own internal scrolling, so prevent the
// surrounding layout from scrolling while this page is active. Restore
// it on unmount so subsequent pages (e.g. edit) are not broken.
const layoutMainEl = ref<HTMLElement | null>(null);
onMounted(() => {
    const main = document.querySelector<HTMLElement>(
        '.d-flex.flex-column.vh-100 > main.overflow-y-auto'
    );
    if (main) {
        layoutMainEl.value = main;
        main.style.overflow = 'hidden';
    }
});
onUnmounted(() => {
    if (layoutMainEl.value) {
        layoutMainEl.value.style.overflow = '';
    }
});

const { set: setBreadcrumb } = useAppBreadcrumb();

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
    {
        watch: [formPath],
        transform: (raw: any) => {
            if (raw) setBreadcrumb('forms', raw);
            return raw;
        },
    }
);
const pending = computed(() => status.value === 'pending');

const { isNotFound, hasError, errorMessage } = usePageError(formError, status);

// Fetch schema artifacts (json/ui are derived from the stored definition on
// demand — the definition itself is the source of truth and exchanged via
// @vjfb-definition-change)
const { data: schema } = useAsyncData(
    `form-schema-${formPath.value}`,
    () =>
        orpc.forms.schema.getLatestArtifacts({
            params: { id: formPath.value },
        }),
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

function goEdit() {
    router.push(Routes.formsEdit(formPath.value));
}

function goVersions() {
    router.push(Routes.formsVersions(formPath.value));
}

// Builder expand/collapse toggle (fullscreen overlay)
const builderExpanded = ref(false);

// Realtime collaboration via Hocuspocus (collab-server). The synced document
// is the source of truth once enabled — jsonSchema/uiSchema props are ignored
// by the builder in collab mode, so existing legacy schemas stay untouched.
//
// The WebSocket only accepts authenticated connections: the browser sends
// its `nuxt-session` cookie with the handshake and the collab server asks
// the Nuxt backend (GET /api/ws-auth) to validate it — no token minting
// needed on the frontend.
const collab = computed<CollabConfig | null>(() => {
    const url = runtimeConfig.public.collabUrl as string | undefined;
    if (!url || !form.value?.id || !user.value) return null;
    return {
        url,
        documentName: String(form.value.id),
        user: {
            id: String(user.value.id),
            name: user.value.username ?? 'User',
        },
    };
});

// Debounced save of builder changes. The canonical FormDefinition
// representation (root/elements/dependencies) is the persisted format — the
// backend stores it as a yjs document and derives the json/ui schema
// artifacts from it on demand.
const saveTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const { notify } = useNotify();

async function onDefinitionChange(definition: object) {
    const formId = form.value?.id;
    if (!formId) return;
    // In collab mode the Hocuspocus server persists the synced document to
    // the DB in the background — a manual import here would fight it and
    // trigger a misleading "Schema erfolgreich gespeichert" toast on every
    // keystroke. Only the local (non-collab) path saves explicitly.
    if (collab.value) return;
    if (saveTimer.value) clearTimeout(saveTimer.value);
    saveTimer.value = setTimeout(async () => {
        try {
            await orpc.forms.schema.import({
                params: { id: String(formId) },
                body: { definition: definition as Record<string, unknown> },
            });
            notify(t('forms.detail.schemaSaveSuccess'), 'success');
        } catch (err: any) {
            console.error('Failed to save form content', err);
            const msg = err?.message ?? String(err);
            notify(`${t('forms.detail.schemaSaveError')}: ${msg}`, 'danger');
        }
    }, 1000);
}
</script>

<template>
    <BasePage
        :title="form?.title || '...'"
        :description="form?.description ?? undefined"
        icon="ph:file-text"
        body-full-width
    >
        <template #actions>
            <BButton
                v-b-tooltip="
                    builderExpanded ? t('common.collapse') : t('common.expand')
                "
                variant="outline-secondary"
                size="sm"
                @click="builderExpanded = !builderExpanded"
            >
                <Icon
                    :name="builderExpanded ? 'ph:arrows-in' : 'ph:arrows-out'"
                    :size="14"
                />
            </BButton>
            <BButton variant="outline-secondary" size="sm" @click="goVersions">
                <Icon
                    name="ph:clock-counter-clockwise"
                    :size="14"
                    class="me-1"
                />{{ t('forms.versions.title') }}
            </BButton>
            <BButton variant="outline-secondary" size="sm" @click="goEdit">
                <Icon name="ph:pencil" :size="14" class="me-1" />{{
                    t('common.edit')
                }}
            </BButton>
        </template>

        <!-- Error states (inside BasePage body) -->
        <template v-if="hasError">
            <div class="px-4 pt-4">
                <BaseErrorState
                    v-if="isNotFound"
                    icon="ph:warning-circle"
                    :title="t('forms.detail.notFound')"
                    :description="errorMessage"
                    :action-route="Routes.FORMS"
                    :action-label="t('forms.detail.backToForms')"
                />
                <BaseErrorState
                    v-else
                    icon="ph:bug"
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
                    :jsonSchema="collab ? undefined : jsonSchemaString"
                    :uiSchema="collab ? undefined : uiSchemaString"
                    :collab="collab"
                    hideHeader
                    @vjfb-definition-change="onDefinitionChange"
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
                    <Icon name="ph:x" :size="14" class="me-1" />{{
                        t('common.close')
                    }}
                </BButton>
            </div>
            <div
                class="flex-grow-1 d-flex flex-column overflow-hidden"
                style="min-height: 0"
            >
                <VueJsonFormBuilder
                    :jsonSchema="collab ? undefined : jsonSchemaString"
                    :uiSchema="collab ? undefined : uiSchemaString"
                    :collab="collab"
                    hideHeader
                    @vjfb-definition-change="onDefinitionChange"
                />
            </div>
        </div>
    </Teleport>
</template>
