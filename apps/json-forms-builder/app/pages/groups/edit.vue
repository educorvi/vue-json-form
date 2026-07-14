<script setup lang="ts">
/**
 * /groups/edit?path=<path> — Edit a group.
 * Path is the URL-encoded group path.
 */
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';

import ConfirmTypingDelete from '@/components/utils/ConfirmTypingDelete.vue';

definePageMeta({ middleware: ['authenticated'], layout: 'base-layout' });

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;

const groupPath = computed(() =>
    decodeURIComponent((route.query.path as string) ?? '')
);

const {
    data: group,
    error: groupError,
    status,
} = useAsyncData(
    () => `group-edit-${groupPath.value}`,
    () => orpc.groups.get({ params: { id: groupPath.value } }),
    { watch: [groupPath] }
);
const pending = computed(() => status.value === 'pending');

const { isNotFound, hasError, errorMessage } = usePageError(groupError, status);

const { set: setBreadcrumb } = useAppBreadcrumb();
watch(
    group,
    (g) => {
        if (g) setBreadcrumb('groups', g, t('groups.edit.title'));
    },
    { immediate: true }
);

// ── General section state ─────────────────────────────────────────────────
const editTitle = ref('');
const editDescription = ref('');
const saving = ref(false);
const savedMsg = ref(false);
const saveErrorMsg = ref<string | null>(null);

watch(group, (g) => {
    if (g) {
        editTitle.value = g.title ?? '';
        editDescription.value = g.description ?? '';
    }
});

async function onSaveGeneral() {
    if (!group.value) return;
    saving.value = true;
    savedMsg.value = false;
    saveErrorMsg.value = null;
    try {
        await orpc.groups.update({
            params: { id: groupPath.value },
            body: {
                title: editTitle.value.trim(),
                description: editDescription.value.trim() || null,
            } as any,
        });
        savedMsg.value = true;
        refreshNuxtData(`group-${groupPath.value}`);
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
    if (!group.value) return;
    deletePending.value = true;
    deleteError.value = null;
    try {
        await orpc.groups.update({
            params: { id: groupPath.value },
            body: {
                title: editTitle.value.trim() || 'deleted',
                created_by: null as any,
                updated_by: null as any,
            },
        });
        showDeleteModal.value = false;
        router.push(Routes.GROUPS);
    } catch (err: any) {
        deleteError.value = err?.message ?? String(err);
    } finally {
        deletePending.value = false;
    }
}

function goDetail() {
    router.push(Routes.groupsDetail(groupPath.value));
}
</script>

<template>
    <BasePage
        icon="pencil"
        :title="t('groups.edit.title')"
        :description="t('groups.edit.subtitle')"
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
                    <BPlaceholder animation="glow" width="100%" height="5rem" />
                </div>
            </BCardBody>
        </BCard>
        <template v-else-if="hasError">
            <BaseErrorState
                v-if="isNotFound"
                icon="warning-circle"
                :title="t('groups.notFound')"
                :description="errorMessage"
                :action-route="Routes.GROUPS"
                :action-label="t('groups.backToGroups')"
            />
            <BaseErrorState
                v-else
                icon="bug"
                :title="t('common.errorTitle')"
                :description="errorMessage"
                :action-route="Routes.GROUPS"
                :action-label="t('groups.backToGroups')"
            />
        </template>
        <template v-else-if="group">
            <!-- General settings (includes read-only metadata + edit fields) -->
            <GroupSettingsGeneral
                v-model="editTitle"
                :description="editDescription"
                :group-id="group.id"
                :group-path="groupPath"
                :group-name="group.name ?? ''"
                :saving="saving"
                :saved-msg="savedMsg"
                :save-error="saveErrorMsg"
                @update:description="editDescription = $event"
                @save="onSaveGeneral"
            />

            <!-- Advanced settings -->
            <GroupSettingsAdvanced @delete="showDeleteModal = true" />
        </template>

        <!-- Delete modal -->
        <ConfirmTypingDelete
            v-if="group"
            v-model="showDeleteModal"
            :title="t('groups.delete.title')"
            :warning="t('groups.delete.warning')"
            :item-name="group.title ?? group.name ?? ''"
            :confirm-label="t('groups.delete.confirm')"
            :cancel-label="t('common.cancel')"
            :pending="deletePending"
            :error="deleteError"
            @confirm="onDeleteConfirm"
        />
    </BasePage>
</template>
