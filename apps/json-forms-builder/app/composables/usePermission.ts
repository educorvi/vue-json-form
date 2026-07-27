/**
 * usePermission – Shared composable for managing permissions on groups and forms.
 *
 * Provides reactivity for listing, creating, patching, and deleting permissions.
 * Works with both group and form permission endpoints.
 */

import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';

export interface PermissionEntry {
    id: number;
    role: string;
    scope: 'direct' | 'inherited';
    /** For direct permissions: the highest inherited role from parent
     *  groups, or null. For inherited permissions: always null. */
    inherited_role?: string | null;
    expired: boolean;
    expire: string | null;
    type: 'user';
    user: {
        id: string;
        name: string;
        email: string;
        role?: string;
    };
    source_group_id?: number | null;
    source_group_name?: string | null;
    source_group_path?:
        { id: number; name: string; path_segment: string }[] | null;
    created?: string | null;
    updated?: string | null;
    created_by?: unknown;
    updated_by?: unknown;
}

export interface PermissionPaginated {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
    elements: PermissionEntry[];
}

/**
 * The role hierarchy. Higher index = more privileged.
 */
export const ROLE_HIERARCHY: Record<string, number> = {
    owner: 2,
    editor: 1,
    guest: 0,
};

/**
 * Check whether a user who has `inheritedRole` can be assigned `targetRole`.
 * A user can only be assigned a role that is AT LEAST as high as their inherited role.
 */
export function isRoleAssignable(
    targetRole: string,
    inheritedRole: string | null
): boolean {
    if (!inheritedRole) return true;
    const targetLevel = ROLE_HIERARCHY[targetRole] ?? 0;
    const inheritedLevel = ROLE_HIERARCHY[inheritedRole] ?? 0;
    return targetLevel >= inheritedLevel;
}

/**
 * Get the highest role among inherited permissions for this user.
 */
export function getHighestInheritedRole(
    entries: PermissionEntry[],
    userId: number | string
): string | null {
    let highest: string | null = null;
    let highestLevel = -1;
    for (const entry of entries) {
        if (
            entry.scope === 'inherited' &&
            String(entry.user?.id) === String(userId) &&
            entry.role
        ) {
            const level = ROLE_HIERARCHY[entry.role] ?? 0;
            if (level > highestLevel) {
                highestLevel = level;
                highest = entry.role;
            }
        }
    }
    return highest;
}

/**
 * Composable to manage permissions for a resource (group or form).
 *
 * @param orpc - The oRPC client instance
 * @param resourceType - 'groups' or 'forms'
 * @param resourceId - The path/slug/ID of the resource
 */
export function usePermission(
    orpc: RouterClient<AppRouter>,
    resourceType: 'groups' | 'forms',
    resourceId: MaybeRefOrGetter<string>
) {
    const resolvedId = computed(() => toValue(resourceId));

    // ── Reactive state ───────────────────────────────────────────────────

    const permissions = ref<PermissionEntry[]>([]);
    const totalCount = ref(0);
    const totalPages = ref(0);
    const currentPage = ref(1);
    const pageSize = ref(20);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // ── Fetch permissions ────────────────────────────────────────────────

    async function fetchPermissions() {
        if (!resolvedId.value) return;
        loading.value = true;
        error.value = null;
        try {
            const router = resourceType === 'groups' ? orpc.groups : orpc.forms;
            const result = (await (router as any).permissions.list({
                params: { id: resolvedId.value },
                query: {
                    page: currentPage.value,
                    page_size: pageSize.value,
                },
            })) as PermissionPaginated;
            permissions.value = result.elements ?? [];
            totalCount.value = result.total_count ?? 0;
            totalPages.value = result.total_pages ?? 0;
        } catch (err: any) {
            const msg = err?.message ?? String(err);
            error.value = msg;
            permissions.value = [];
        } finally {
            loading.value = false;
        }
    }

    // ── Create permission ────────────────────────────────────────────────

    async function createPermission(data: {
        role: string;
        user_id: string;
        expire?: string | null;
    }): Promise<PermissionEntry> {
        const router = resourceType === 'groups' ? orpc.groups : orpc.forms;
        const result = (await (router as any).permissions.create({
            params: { id: resolvedId.value },
            body: {
                type: 'user',
                role: data.role,
                user_id: data.user_id,
                expire: data.expire ?? null,
            },
        })) as PermissionEntry;
        return result;
    }

    // ── Patch permission ─────────────────────────────────────────────────

    async function patchPermission(
        permissionId: number,
        data: { role?: string; expire?: string | null }
    ): Promise<PermissionEntry> {
        const router = resourceType === 'groups' ? orpc.groups : orpc.forms;
        const result = (await (router as any).permissions.patch({
            params: { id: resolvedId.value, permissionId },
            body: {
                role: data.role,
                expire: data.expire ?? null,
            },
        })) as PermissionEntry;
        return result;
    }

    // ── Delete permission ────────────────────────────────────────────────

    async function deletePermission(permissionId: number): Promise<void> {
        const router = resourceType === 'groups' ? orpc.groups : orpc.forms;
        await (router as any).permissions.delete({
            params: { id: resolvedId.value, permissionId },
        });
    }

    // ── Watchers ─────────────────────────────────────────────────────────

    watch(
        [currentPage, pageSize, resolvedId],
        () => {
            fetchPermissions();
        },
        { immediate: false }
    );

    return {
        // State
        permissions,
        totalCount,
        totalPages,
        currentPage,
        pageSize,
        loading,
        error,
        // Actions
        fetchPermissions,
        createPermission,
        patchPermission,
        deletePermission,
    };
}
