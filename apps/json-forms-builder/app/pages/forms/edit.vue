<script setup lang="ts">
/**
 * /forms/edit?path=<path> — Edit a form.
 * Path is the URL-encoded form path.
 */
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';
import ConfirmTypingDelete from '@/components/utils/ConfirmTypingDelete.vue';
definePageMeta({ middleware: ['authenticated'], layout: 'base-layout' });

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;

const formPath = computed(() =>
    decodeURIComponent((route.query.path as string) ?? '')
);

const {
    data: form,
    error: formError,
    status,
} = useAsyncData(
    () => `form-edit-${formPath.value}`,
    () => orpc.forms.get({ params: { id: formPath.value } }),
    { watch: [formPath] }
);
const pending = computed(() => status.value === 'pending');

const { isNotFound, hasError, errorMessage } = usePageError(formError, status);

const { set: setBreadcrumb } = useAppBreadcrumb();
watch(
    form,
    (f) => {
        if (f) setBreadcrumb('forms', f, t('forms.edit.title'));
    },
    { immediate: true }
);

// ── General section state ─────────────────────────────────────────────────
const editTitle = ref('');
const editDescription = ref('');
const editSlug = ref('');
const saving = ref(false);
const savedMsg = ref(false);
const saveErrorMsg = ref<string | null>(null);

watch(form, (f) => {
    if (f) {
        editTitle.value = f.title ?? '';
        editDescription.value = f.description ?? '';
        editSlug.value = f.name ?? '';
    }
});

async function onSaveGeneral() {
    if (!form.value) return;
    saving.value = true;
    savedMsg.value = false;
    saveErrorMsg.value = null;
    try {
        await orpc.forms.update({
            params: { id: formPath.value },
            query: { id: formPath.value },
            body: {
                title: editTitle.value.trim(),
                description: editDescription.value.trim() || null,
            } as any,
        });
        savedMsg.value = true;
        refreshNuxtData(`form-${formPath.value}`);
    } catch (err: any) {
        saveErrorMsg.value = err?.message ?? String(err);
    } finally {
        saving.value = false;
    }
}

// ── Advanced section (delete) state ───────────────────────────────────────
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

function goDetail() {
    router.push(Routes.formsDetail(formPath.value));
}
</script>

<template>
    <BasePage
        icon="pencil"
        :title="t('forms.edit.title')"
        :description="t('forms.edit.subtitle')"
    >
        <template #actions>
            <BButton variant="outline-secondary" size="sm" @click="goDetail">
                {{ t('common.cancel') }}
            </BButton>
        </template>

        <BCard v-if="pending">
            <BCardBody>
                <div class="d-flex flex-column gap-3">
                    <BPlaceholder
                        animation="glow"
                        width="100%"
                        height="2.5rem"
                    />
                    <BPlaceholder
                        animation="glow"
                        width="100%"
                        height="2.5rem"
                    />
                </div>
            </BCardBody>
        </BCard>
        <template v-else-if="hasError">
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
        </template>
        <template v-else-if="form">
            <!-- General settings (includes read-only metadata + edit fields) -->
            <FormSettingsGeneral
                v-model="editTitle"
                :description="editDescription"
                :form-id="form.id"
                :form-path="formPath"
                :form-name="editSlug"
                :saving="saving"
                :saved-msg="savedMsg"
                :save-error="saveErrorMsg"
                @update:description="editDescription = $event"
                @save="onSaveGeneral"
            />

            <!-- Advanced settings -->
            <FormSettingsAdvanced @delete="showDeleteModal = true" />
        </template>

        <!-- Delete modal -->
        <ConfirmTypingDelete
            v-if="form"
            v-model="showDeleteModal"
            :title="t('forms.delete.title')"
            :warning="t('forms.delete.warning')"
            :item-name="form.title ?? ''"
            :confirm-label="t('forms.delete.confirm')"
            :cancel-label="t('common.cancel')"
            :pending="deletePending"
            :error="deleteError"
            @confirm="onDeleteConfirm"
        />
    </BasePage>
</template>
