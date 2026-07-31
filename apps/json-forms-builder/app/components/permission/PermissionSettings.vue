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
import type {
    PermissionEntry,
    ElementRole,
    PermissionSortBy,
} from '@/composables/usePermission';
import {
    usePermission,
    getHighestInheritedRole,
} from '@/composables/usePermission';

const props = defineProps<{
    resourceType: 'groups' | 'forms';
    resourceId: string;
}>();

const { t } = useI18n();
const { notify } = useNotify();

const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;

const {
    permissions,
    totalCount,
    totalPages,
    currentPage,
    pageSize,
    search,
    sortOrder,
    orderBy,
    loading,
    error,
    fetchPermissions,
    createPermission,
    patchPermission,
    deletePermission,
} = usePermission(orpc, props.resourceType, () => props.resourceId);

// Group list uses `order_by` (firstname/lastname/email), form list uses
// `sortBy` (name) — so the sort options differ per resource type.
const sortOptions = computed<{ label: string; value: PermissionSortBy }[]>(
    () => {
        if (props.resourceType === 'groups') {
            return [
                { label: t('permissions.sortBy.lastname'), value: 'lastname' },
                { label: t('permissions.sortBy.role'), value: 'role' },
                { label: t('permissions.sortBy.scope'), value: 'scope' },
                { label: t('permissions.sortBy.expire'), value: 'expire' },
                { label: t('permissions.sortBy.created'), value: 'created' },
            ];
        }
        return [
            { label: t('permissions.sortBy.name'), value: 'name' },
            { label: t('permissions.sortBy.role'), value: 'role' },
            { label: t('permissions.sortBy.scope'), value: 'scope' },
            { label: t('permissions.sortBy.expire'), value: 'expire' },
            { label: t('permissions.sortBy.created'), value: 'created' },
        ];
    }
);

function onSearchChange(val: string) {
    search.value = val;
    currentPage.value = 1;
}

// ── Add modal ──────────────────────────────────────────────────────────────

const showAddModal = ref(false);

async function handleAdd(data: {
    role: ElementRole;
    user_id: string;
    expire: string | null;
}) {
    try {
        await createPermission({
            role: data.role,
            user_id: data.user_id,
            expire: data.expire,
        });
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
    inheritedRoleForEdit.value = getHighestInheritedRole(
        permissions.value,
        perm.user?.id ?? 0
    );
    showEditModal.value = true;
}

async function handleEdit(
    permissionId: number,
    data: { role?: ElementRole; expire?: string | null }
) {
    try {
        await patchPermission(permissionId, {
            role: data.role,
            expire: data.expire ?? null,
        });
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

        <!-- Search + sort toolbar -->
        <ListToolbar
            v-model:search="search"
            v-model:order-by="orderBy"
            v-model:sort-order="sortOrder"
            :sort-options="sortOptions"
            class="mb-3"
            @update:search="onSearchChange"
        />

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
