<!--
    PermissionSettings – Reusable permission management section.

    Works for both groups and forms. Specify the `resourceType` ('groups' | 'forms')
    and `resourceId` (the URL path/slug), and this component handles everything:
    listing, adding, editing, and deleting permissions.

    This is designed to be used inside a SettingsSection card on edit pages.
-->
<script setup lang="ts">
import type {
    PermissionEntry,
    PermissionSortBy,
} from '@/composables/usePermission';
import type { ElementRole } from '@/utils/api-types';
import {
    usePermission,
    getHighestInheritedRole,
    ROLE_HIERARCHY,
} from '@/composables/usePermission';
import type { ResourceWithAccess } from '@/composables/useResourceAccess';
import ConfirmTypingDelete from '@/components/utils/ConfirmTypingDelete.vue';

const props = defineProps<{
    resourceType: 'groups' | 'forms';
    resourceId: string;
    /** The fetched group/form (carries `effective_role` from the server). */
    resource: ResourceWithAccess | null;
}>();

const { t } = useI18n();
const { notify } = useNotify();

const orpc = useNuxtApp().$orpc;
const { user: sessionUser } = useUserSession();
const currentUserId = computed(() => sessionUser.value?.id ?? null);

// Access control: only users with at least `owner` on this resource (or
// admins) may add/edit/remove permissions. The effective role comes
// server-side with the resource payload — no extra request, no pending
// state, so SSR renders the final button state immediately.
const access = useResourceAccess(() => props.resource);
const canManage = computed(() => access.canManagePermissions.value);
/** True when the caller is the ONLY owner of this resource. */
const isOnlyOwner = computed(() => access.isOnlyOwner.value);

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
const inheritedRoleForEdit = ref<ElementRole | null>(null);

function onEdit(perm: PermissionEntry) {
    editingPermission.value = perm;
    inheritedRoleForEdit.value = getHighestInheritedRole(
        permissions.value,
        perm.user?.id ?? 0
    );
    showEditModal.value = true;
}

/**
 * The user's own permission entry — used to warn before the user removes
 * or demotes themselves.
 */
function isOwnRow(perm: PermissionEntry): boolean {
    return !!currentUserId.value && perm.user?.id === currentUserId.value;
}

async function handleEdit(
    permissionId: number,
    data: { role?: ElementRole; expire?: string | null }
) {
    const perm = editingPermission.value;
    // Changing your own role to a lower one is a sensitive action — warn
    // and require typed confirmation first.
    if (
        perm &&
        isOwnRow(perm) &&
        data.role &&
        data.role !== perm.role &&
        ROLE_HIERARCHY[data.role] < ROLE_HIERARCHY[perm.role ?? 'guest']
    ) {
        openTypedConfirm({
            kind: 'demote-self',
            permission: perm,
            pendingPatch: data,
        });
        return;
    }
    await applyEdit(permissionId, data);
}

async function applyEdit(
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

// ── Typed confirmation (remove/demote yourself) ────────────────────────────

/**
 * Two risky self-actions require typing the own name first (same pattern
 * as deleting groups/forms):
 * - `delete-self`: you are the ONLY owner and try to remove your own
 *   owner permission — the backend rejects this, but the user must be
 *   warned and confirm first.
 * - `demote-self`: you change your own role to a lower role.
 */
const typedConfirmState = ref<{
    kind: 'delete-self' | 'demote-self';
    permission: PermissionEntry;
    pendingPatch?: { role?: ElementRole; expire?: string | null };
} | null>(null);
const typedConfirmPending = ref(false);
const typedConfirmError = ref<string | null>(null);

/** v-model bridge for ConfirmTypingDelete — open while a state is set. */
const showTypedConfirm = computed({
    get: () => typedConfirmState.value !== null,
    set: (val: boolean) => {
        if (!val) typedConfirmState.value = null;
    },
});

function openTypedConfirm(state: {
    kind: 'delete-self' | 'demote-self';
    permission: PermissionEntry;
    pendingPatch?: { role?: ElementRole; expire?: string | null };
}) {
    typedConfirmState.value = state;
    typedConfirmError.value = null;
}

async function confirmTypedAction() {
    const state = typedConfirmState.value;
    if (!state) return;
    typedConfirmPending.value = true;
    typedConfirmError.value = null;
    try {
        if (state.kind === 'delete-self') {
            await deletePermission(state.permission.id);
            notify(t('permissions.deleteSuccess'), 'success');
        } else {
            await patchPermission(state.permission.id, {
                role: state.pendingPatch?.role,
                expire: state.pendingPatch?.expire ?? null,
            });
            notify(t('permissions.patchSuccess'), 'success');
        }
        typedConfirmState.value = null;
        showEditModal.value = false;
        editingPermission.value = null;
        await fetchPermissions();
    } catch (err: any) {
        const msg = err?.message ?? String(err);
        typedConfirmError.value = msg;
        notify(
            `${
                state.kind === 'delete-self'
                    ? t('permissions.deleteError')
                    : t('permissions.patchError')
            }: ${msg}`,
            'danger'
        );
    } finally {
        typedConfirmPending.value = false;
    }
}

// ── Delete confirmation ────────────────────────────────────────────────────

const showDeleteModal = ref(false);
const deletingPermission = ref<PermissionEntry | null>(null);
const deletePending = ref(false);
const deleteError = ref<string | null>(null);

function onDelete(perm: PermissionEntry) {
    // Removing your own owner permission while being the only owner is not
    // allowed — warn and require typed confirmation first.
    if (isOwnRow(perm) && perm.role === 'owner' && isOnlyOwner.value) {
        openTypedConfirm({ kind: 'delete-self', permission: perm });
        return;
    }
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
            <BButton
                v-if="canManage"
                variant="primary"
                size="sm"
                @click="showAddModal = true"
                data-testid="add-permission-button"
            >
                <Icon name="ph:plus" :size="14" class="me-1" />
                {{ t('permissions.addButton') }}
            </BButton>
        </template>

        <!-- Error alert -->
        <BAlert
            v-if="error"
            show
            variant="danger"
            :dismissible="true"
            class="mb-2"
        >
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
            :can-manage="canManage"
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
        :resource-type="resourceType"
        :resource-id="resourceId"
        @add="handleAdd"
    />

    <!-- Edit permission modal -->
    <PermissionEditModal
        v-model="showEditModal"
        :permission="editingPermission"
        :inherited-role="inheritedRoleForEdit"
        :lock-owner-role="
            !!(
                editingPermission &&
                isOwnRow(editingPermission) &&
                editingPermission.role === 'owner' &&
                isOnlyOwner
            )
        "
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
        <BAlert v-if="deleteError" show variant="danger" class="mb-0">
            {{ deleteError }}
        </BAlert>
    </BModal>

    <!-- Typed confirmation: remove yourself as the only owner / demote yourself -->
    <ConfirmTypingDelete
        v-if="typedConfirmState"
        v-model="showTypedConfirm"
        :title="
            typedConfirmState.kind === 'delete-self'
                ? t('permissions.onlyOwner.deleteTitle')
                : t('permissions.onlyOwner.demoteTitle')
        "
        :warning="
            typedConfirmState.kind === 'delete-self'
                ? t('permissions.onlyOwner.deleteWarning')
                : t('permissions.onlyOwner.demoteWarning', {
                      role: t(
                          `permissions.roles.${typedConfirmState.pendingPatch?.role ?? 'guest'}`
                      ),
                  })
        "
        :item-name="typedConfirmState.permission.user?.name ?? ''"
        :confirm-label="t('common.confirm')"
        :cancel-label="t('common.cancel')"
        :pending="typedConfirmPending"
        :error="typedConfirmError"
        @confirm="confirmTypedAction"
    />
</template>
