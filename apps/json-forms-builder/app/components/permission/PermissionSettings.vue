<!--
    PermissionSettings – Reusable permission management section.

    Works for both groups and forms. Specify the `resourceType` ('groups' | 'forms')
    and `resourceId` (the URL path/slug), and this component handles everything:
    listing, adding, editing, and deleting permissions.

    This is designed to be used inside a SettingsSection card on edit pages.
-->
<script setup lang="ts">
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';
import type { PermissionEntry } from '@/composables/usePermission';
import { usePermission } from '@/composables/usePermission';

const props = defineProps<{
    orpc: RouterClient<AppRouter>;
    resourceType: 'groups' | 'forms';
    resourceId: string;
}>();

const { t } = useI18n();
const { notify } = useNotify();

const {
    permissions,
    totalCount,
    totalPages,
    currentPage,
    pageSize,
    loading,
    error,
    fetchPermissions,
    createPermission,
    patchPermission,
    deletePermission,
} = usePermission(props.orpc, props.resourceType, () => props.resourceId);

// ── Add modal ──────────────────────────────────────────────────────────────

const showAddModal = ref(false);

async function handleAdd(data: {
    role: string;
    user_id: string;
    expire: string | null;
}) {
    try {
        await createPermission(data);
        notify(t('permissions.addSuccess'), 'success');
        showAddModal.value = false;
        await fetchPermissions();
    } catch (err: any) {
        const msg = err?.message ?? String(err);
        notify(`${t('permissions.createError')}: ${msg}`, 'danger');
    }
}

// ── Initial fetch ──────────────────────────────────────────────────────────

watch(
    () => props.resourceId,
    (id) => {
        if (id) fetchPermissions();
    },
    { immediate: true }
);

// ── Edit modal ─────────────────────────────────────────────────────────────

const showEditModal = ref(false);
const editingPermission = ref<PermissionEntry | null>(null);
const inheritedRoleForEdit = ref<string | null>(null);

function onEdit(perm: PermissionEntry) {
    editingPermission.value = perm;
    inheritedRoleForEdit.value = perm.inherited_role ?? null;
    showEditModal.value = true;
}

async function handleEdit(
    permissionId: number,
    data: { role?: string; expire?: string | null }
) {
    try {
        await patchPermission(permissionId, data);
        notify(t('permissions.patchSuccess'), 'success');
        showEditModal.value = false;
        editingPermission.value = null;
        await fetchPermissions();
    } catch (err: any) {
        const msg = err?.message ?? String(err);
        notify(`${t('permissions.patchError')}: ${msg}`, 'danger');
    }
}

// ── Delete confirmation ────────────────────────────────────────────────────

const showDeleteModal = ref(false);
const deletingPermission = ref<PermissionEntry | null>(null);
const deletePending = ref(false);
const deleteError = ref<string | null>(null);

function onDelete(perm: PermissionEntry) {
    deletingPermission.value = perm;
    deleteError.value = null;
    showDeleteModal.value = true;
}

async function confirmDelete() {
    if (!deletingPermission.value) return;
    deletePending.value = true;
    deleteError.value = null;
    try {
        await deletePermission(deletingPermission.value.id);
        notify(t('permissions.deleteSuccess'), 'success');
        showDeleteModal.value = false;
        deletingPermission.value = null;
        await fetchPermissions();
    } catch (err: any) {
        const msg = err?.message ?? String(err);
        deleteError.value = msg;
        notify(`${t('permissions.deleteError')}: ${msg}`, 'danger');
    } finally {
        deletePending.value = false;
    }
}
</script>

<template>
    <SettingsSection
        id="permissions"
        :title="t('settings.permissions')"
        :description="t('settings.permissionsDescription')"
    >
        <template #actions>
            <BButton variant="primary" size="sm" @click="showAddModal = true">
                <PhosphorIcon name="plus" :size="14" class="me-1" />
                {{ t('permissions.addButton') }}
            </BButton>
        </template>

        <!-- Error alert -->
        <BAlert v-if="error" variant="danger" :dismissible="true" class="mb-2">
            {{ t('permissions.loadError') }}
            {{ error }}
        </BAlert>

        <!-- Permission table -->
        <PermissionTable
            :permissions="permissions"
            :loading="loading"
            :total-count="totalCount"
            :total-pages="totalPages"
            :current-page="currentPage"
            :page-size="pageSize"
            @update:current-page="currentPage = $event"
            @update:page-size="pageSize = $event"
            @edit="onEdit"
            @delete="onDelete"
        />
    </SettingsSection>

    <!-- Add permission modal -->
    <PermissionAddModal
        v-model="showAddModal"
        :orpc="orpc"
        :existing-permissions="permissions"
        @add="handleAdd"
    />

    <!-- Edit permission modal -->
    <PermissionEditModal
        v-model="showEditModal"
        :permission="editingPermission"
        :inherited-role="inheritedRoleForEdit"
        @save="handleEdit"
    />

    <!-- Delete confirmation modal -->
    <BModal
        v-model="showDeleteModal"
        :title="t('permissions.deleteTitle')"
        :ok-title="t('common.delete')"
        :cancel-title="t('common.cancel')"
        :ok-variant="'danger'"
        :ok-disabled="deletePending"
        @ok="confirmDelete"
    >
        <p>{{ t('permissions.deleteConfirm') }}</p>
        <div v-if="deletingPermission" class="mb-2">
            <UserPreviewCell
                :name="deletingPermission.user?.name ?? ''"
                :email="deletingPermission.user?.email ?? ''"
            />
        </div>
        <BAlert v-if="deleteError" variant="danger" class="mb-0">
            {{ deleteError }}
        </BAlert>
    </BModal>
</template>
