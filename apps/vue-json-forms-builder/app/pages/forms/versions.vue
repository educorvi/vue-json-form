<script setup lang="ts">
/**
 * /forms/versions?path=<path> — Form version history.
 *
 * Lists all immutable versions of a form. For each version the JSON + UI
 * schemas (artifacts) can be inspected and rendered live with the
 * `VueJsonForm` component (the same component the form builder uses for its
 * preview). The current latest state can be previewed too, and new versions
 * can be created (version number + comment + optional schema overrides).
 */
import VersionDataTable from './VersionDataTable.vue';
import { VueJsonForm, bootstrapComponents } from '@educorvi/vue-json-form';
import { AjvValidator } from '@educorvi/vue-json-form-ajv-validator';
import type z from 'zod';
import { zFormVersionRef } from '~~/server/orpc/generated/zod.gen';

definePageMeta({ middleware: ['authenticated'], layout: 'base-layout' });

type FormVersion = z.infer<typeof zFormVersionRef>;

const { t } = useI18n();
const { notify } = useNotify();
const { copyToClipboard } = useClipboard();
const route = useRoute();
const router = useRouter();
const orpc = useNuxtApp().$orpc;

const { set: setBreadcrumb } = useAppBreadcrumb();

const formPath = computed(() => decodedPathQuery(route.query));

// ── Form metadata (title, access) ──────────────────────────────────────────

const {
    data: form,
    error: formError,
    status,
} = useAsyncData(
    () => `form-versions-${formPath.value}`,
    () => orpc.forms.get({ params: { id: formPath.value } }),
    {
        watch: [formPath],
        transform: (raw: any) => {
            if (raw) setBreadcrumb('forms', raw, t('forms.versions.title'));
            return raw;
        },
    }
);
const formPending = computed(() => status.value === 'pending');

const { isNotFound, hasError, errorMessage } = usePageError(formError, status);

/** Only owners/editors (and admins, who resolve to owner) may create versions. */
const canManage = computed(
    () =>
        form.value?.effective_role === 'owner' ||
        form.value?.effective_role === 'editor'
);

// ── Version list ───────────────────────────────────────────────────────────

const currentPage = ref(1);
const pageSize = ref(20);

const versionsQuery = computed(() => ({
    page: currentPage.value,
    page_size: pageSize.value,
}));

const {
    data: versionsData,
    pending,
    error,
    refresh,
} = useAsyncData(
    () => `form-versions-list-${formPath.value}`,
    () =>
        orpc.forms.versions.list({
            params: { id: formPath.value },
            query: versionsQuery.value,
        }),
    { watch: [versionsQuery, formPath] }
);

const versions = computed(() => versionsData.value?.data ?? []);
const totalCount = computed(() => versionsData.value?.total_count ?? 0);

// Navigating between forms resets to the first page (the fetch itself is
// triggered by the useAsyncData watch on formPath).
watch(formPath, () => {
    currentPage.value = 1;
});

function goDetail() {
    router.push(Routes.formsDetail(formPath.value));
}

// ── Preview (VueJsonForm) ──────────────────────────────────────────────────

const previewState = ref<{
    title: string;
    json: Record<string, unknown> | null;
    ui: Record<string, unknown> | null;
} | null>(null);

const showPreview = computed({
    get: () => previewState.value !== null,
    set: (val: boolean) => {
        if (!val) previewState.value = null;
    },
});

function previewVersion(version: FormVersion) {
    previewState.value = {
        title: version.version,
        json: version.json ?? null,
        ui: version.ui ?? null,
    };
}

async function previewLatest() {
    try {
        const schema = await orpc.forms.schema.getLatestArtifacts({
            params: { id: formPath.value },
        });
        previewState.value = {
            title: t('forms.versions.latest'),
            json: schema.json ?? null,
            ui: schema.ui ?? null,
        };
    } catch (err: any) {
        notify(
            `${t('forms.versions.previewLatestError')}: ${err?.message ?? String(err)}`,
            'danger'
        );
    }
}

async function handlePreviewSubmit() {
    // Preview only — nothing to submit.
}

// ── Create version ─────────────────────────────────────────────────────────

const showCreate = ref(false);
const creating = ref(false);
const createError = ref<string | null>(null);
const newVersion = ref('');
const newComment = ref('');
const newJson = ref('');
const newUi = ref('');

/** Default UI schema used by the builder preview when none is stored. */
const DEFAULT_UI_SCHEMA = {
    version: '2.0',
    layout: { type: 'VerticalLayout', elements: [] },
};

function formatJson(value: Record<string, unknown> | null | undefined): string {
    if (!value || Object.keys(value).length === 0) return '';
    return JSON.stringify(value, null, 2);
}

async function openCreate() {
    createError.value = null;
    newVersion.value = '';
    newComment.value = '';
    try {
        // Prefill the schema editors with the current latest state.
        const latest = await orpc.forms.schema.getLatestArtifacts({
            params: { id: formPath.value },
        });
        newJson.value = formatJson(latest.json);
        newUi.value = formatJson(latest.ui);
    } catch {
        newJson.value = '';
        newUi.value = '';
    }
    showCreate.value = true;
}

function parseSchemaField(
    raw: string,
    field: string
): Record<string, unknown> | null | undefined {
    if (!raw.trim()) return undefined; // inherit from latest
    try {
        return JSON.parse(raw);
    } catch {
        createError.value = t('forms.versions.jsonInvalid', { field });
        return null;
    }
}

async function submitCreate() {
    if (!newVersion.value.trim()) {
        createError.value = t('forms.versions.fields.versionRequired');
        return;
    }
    createError.value = null;
    const json = parseSchemaField(
        newJson.value,
        t('forms.versions.fields.jsonSchema')
    );
    if (json === null) return;
    const ui = parseSchemaField(
        newUi.value,
        t('forms.versions.fields.uiSchema')
    );
    if (ui === null) return;

    creating.value = true;
    try {
        await orpc.forms.versions.create({
            params: { id: formPath.value },
            body: {
                version: newVersion.value.trim(),
                comment: newComment.value.trim(),
                ...(json !== undefined ? { json } : {}),
                ...(ui !== undefined ? { ui } : {}),
            },
        });
        notify(t('forms.versions.createSuccess'), 'success');
        showCreate.value = false;
        await refresh();
    } catch (err: any) {
        const msg = err?.message ?? String(err);
        createError.value = msg;
        notify(`${t('forms.versions.createError')}: ${msg}`, 'danger');
    } finally {
        creating.value = false;
    }
}

// ── Artifacts (json/ui schema inspection) ─────────────────────────────────

const artifactState = ref<{
    version: string;
    json: Record<string, unknown> | null;
    ui: Record<string, unknown> | null;
} | null>(null);

const showArtifacts = computed({
    get: () => artifactState.value !== null,
    set: (val: boolean) => {
        if (!val) artifactState.value = null;
    },
});

const activeArtifactTab = ref<'json' | 'ui'>('json');

function openArtifacts(version: FormVersion) {
    artifactState.value = {
        version: version.version,
        json: version.json ?? null,
        ui: version.ui ?? null,
    };
    activeArtifactTab.value = 'json';
}

function formatArtifact(
    value: Record<string, unknown> | null | undefined
): string {
    if (!value || Object.keys(value).length === 0) {
        return t('forms.versions.artifactsMissing');
    }
    return JSON.stringify(value, null, 2);
}

/** Artifact currently shown in the active tab (json or ui). */
const activeArtifact = computed(() => {
    if (!artifactState.value) return null;
    return activeArtifactTab.value === 'json'
        ? artifactState.value.json
        : artifactState.value.ui;
});

const activeArtifactText = computed(() => formatArtifact(activeArtifact.value));

async function copyArtifact() {
    if (!activeArtifact.value) return;
    await copyToClipboard(
        activeArtifactText.value,
        t('forms.versions.artifactCopied')
    );
}

function downloadArtifact() {
    if (!artifactState.value || !activeArtifact.value) return;
    const blob = new Blob([JSON.stringify(activeArtifact.value, null, 2)], {
        type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${artifactState.value.version}-${activeArtifactTab.value}.json`;
    link.click();
    URL.revokeObjectURL(url);
}
</script>

<template>
    <BasePage
        :title="form?.title || '...'"
        :description="form?.description ?? undefined"
        icon="ph:clock-counter-clockwise"
    >
        <template #actions>
            <BButton
                v-if="canManage"
                variant="primary"
                size="sm"
                @click="openCreate"
            >
                <Icon name="ph:plus" :size="14" class="me-1" />{{
                    t('forms.versions.create')
                }}
            </BButton>
            <BButton variant="outline-secondary" size="sm" @click="goDetail">
                <Icon name="ph:arrow-left" :size="14" class="me-1" />{{
                    t('forms.versions.backToDetail')
                }}
            </BButton>
        </template>

        <template v-if="hasError">
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
        </template>

        <template v-else>
            <!-- Loading -->
            <div v-if="formPending" class="px-1">
                <BPlaceholder animation="glow" class="mb-2" width="50%" />
                <BPlaceholder animation="glow" width="30%" />
            </div>

            <div v-else class="px-1">
                <!-- Latest preview -->
                <div class="d-flex justify-content-end mb-2">
                    <BButton
                        variant="outline-primary"
                        size="sm"
                        @click="previewLatest"
                    >
                        <Icon name="ph:play" :size="14" class="me-1" />{{
                            t('forms.versions.previewLatest')
                        }}
                    </BButton>
                </div>

                <VersionDataTable
                    :items="versions"
                    :pending="pending"
                    :error="error ?? null"
                    :current-page="currentPage"
                    :page-size="pageSize"
                    :total-count="totalCount"
                    @preview="previewVersion"
                    @artifacts="openArtifacts"
                    @update:current-page="(v: number) => (currentPage = v)"
                    @update:page-size="(v: number) => (pageSize = v)"
                />
            </div>
        </template>
    </BasePage>

    <!-- Preview modal -->
    <BModal
        v-model="showPreview"
        :title="
            t('forms.versions.previewTitle', {
                version: previewState?.title ?? '',
            })
        "
        size="xl"
        :ok-only="true"
        :ok-title="t('common.close')"
        scrollable
    >
        <div
            v-if="previewState"
            class="p-3 bg-body-tertiary rounded"
            style="max-height: 70vh; overflow-y: auto"
        >
            <VueJsonForm
                :key="
                    JSON.stringify(previewState.json) +
                    JSON.stringify(previewState.ui)
                "
                :json-schema="previewState.json ?? {}"
                :ui-schema="previewState.ui ?? DEFAULT_UI_SCHEMA"
                :on-submit-form="handlePreviewSubmit"
                :render-interface="bootstrapComponents"
                :validator="AjvValidator"
            />
        </div>
    </BModal>

    <!-- Artifacts modal (JSON + UI schema) -->
    <BModal
        v-model="showArtifacts"
        :title="
            t('forms.versions.artifactsTitle', {
                version: artifactState?.version ?? '',
            })
        "
        size="xl"
        :ok-only="true"
        :ok-title="t('common.close')"
        scrollable
    >
        <div v-if="artifactState" class="d-flex justify-content-end gap-2 mb-2">
            <BButton
                variant="outline-secondary"
                size="sm"
                :disabled="!activeArtifact"
                @click="copyArtifact"
            >
                <Icon name="ph:clipboard" :size="14" class="me-1" />{{
                    t('common.copy')
                }}
            </BButton>
            <BButton
                variant="outline-primary"
                size="sm"
                :disabled="!activeArtifact"
                @click="downloadArtifact"
            >
                <Icon name="ph:download-simple" :size="14" class="me-1" />{{
                    t('common.download')
                }}
            </BButton>
        </div>

        <BTabs v-if="artifactState" v-model="activeArtifactTab" class="mt-2">
            <BTab id="json" :title="t('forms.versions.fields.jsonSchema')">
                <pre
                    class="font-monospace small bg-body-tertiary rounded p-3 mb-0 overflow-auto"
                    style="max-height: 60vh"
                    >{{ formatArtifact(artifactState.json) }}</pre>
            </BTab>
            <BTab id="ui" :title="t('forms.versions.fields.uiSchema')">
                <pre
                    class="font-monospace small bg-body-tertiary rounded p-3 mb-0 overflow-auto"
                    style="max-height: 60vh"
                    >{{ formatArtifact(artifactState.ui) }}</pre>
            </BTab>
        </BTabs>
    </BModal>

    <!-- Create version modal -->
    <BModal
        v-model="showCreate"
        :title="t('forms.versions.createTitle')"
        :no-close-on-backdrop="creating"
        :no-close-on-esc="creating"
    >
        <BFormGroup
            :label="t('forms.versions.fields.version')"
            label-class="fw-medium"
            class="mb-3"
        >
            <BFormInput
                v-model="newVersion"
                type="number"
                min="1"
                step="1"
                :placeholder="t('forms.versions.fields.versionPlaceholder')"
            />
            <BFormText class="text-muted">
                {{ t('forms.versions.fields.versionHint') }}
            </BFormText>
        </BFormGroup>

        <BFormGroup
            :label="t('forms.versions.fields.comment')"
            label-class="fw-medium"
            class="mb-3"
        >
            <BFormInput
                v-model="newComment"
                :placeholder="t('forms.versions.fields.commentPlaceholder')"
            />
        </BFormGroup>

        <BFormGroup
            :label="t('forms.versions.fields.jsonSchema')"
            label-class="fw-medium"
            class="mb-3"
        >
            <BFormTextarea
                v-model="newJson"
                rows="6"
                class="font-monospace small"
                :placeholder="t('forms.versions.fields.schemaPlaceholder')"
            />
        </BFormGroup>

        <BFormGroup
            :label="t('forms.versions.fields.uiSchema')"
            label-class="fw-medium"
            class="mb-3"
        >
            <BFormTextarea
                v-model="newUi"
                rows="6"
                class="font-monospace small"
                :placeholder="t('forms.versions.fields.schemaPlaceholder')"
            />
        </BFormGroup>

        <BFormText class="text-muted mb-2">
            {{ t('forms.versions.fields.schemaHint') }}
        </BFormText>

        <BAlert v-if="createError" show variant="danger" class="mb-0">
            {{ createError }}
        </BAlert>

        <template #footer>
            <BButton
                variant="secondary"
                :disabled="creating"
                @click="showCreate = false"
            >
                {{ t('common.cancel') }}
            </BButton>
            <BButton
                variant="primary"
                :disabled="creating"
                @click="submitCreate"
            >
                <BSpinner v-if="creating" small class="me-1" />
                {{ t('forms.versions.create') }}
            </BButton>
        </template>
    </BModal>
</template>
