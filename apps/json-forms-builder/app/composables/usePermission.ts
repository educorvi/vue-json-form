/**
 * usePermission – Shared composable for managing permissions on groups and forms.
 *
 * Provides reactivity for listing, creating, patching, and deleting permissions.
 * Works with both group and form permission endpoints.
 */

import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';
import {
    zPermission,
    zElementRole,
    zListGroupPermissionsQuery,
    zListFormPermissionsQuery,
} from '~~/server/orpc/generated/zod.gen';
import type z from 'zod';

export type PermissionEntry = z.infer<typeof zPermission>;
export type ElementRole = z.infer<typeof zElementRole>;

/**
 * Allowed sort values derived from the generated query schemas.
 * Groups use `order_by`, forms use `sortBy` — both are exposed here so the
 * shared sort state is typed against the actual API enums (no casts).
 */
export type GroupPermissionOrderBy = NonNullable<
    z.infer<typeof zListGroupPermissionsQuery>['order_by']
>;
export type FormPermissionSortBy = NonNullable<
    z.infer<typeof zListFormPermissionsQuery>['sortBy']
>;
export type PermissionSortBy = GroupPermissionOrderBy | FormPermissionSortBy;

/** Validate/narrow a shared sort value against the group `order_by` enum. */
function toGroupOrderBy(
    value: PermissionSortBy
): GroupPermissionOrderBy | undefined {
    const parsed = zListGroupPermissionsQuery.shape.order_by.safeParse(value);
    return parsed.success ? parsed.data : undefined;
}

/** Validate/narrow a shared sort value against the form `sortBy` enum. */
function toFormSortBy(
    value: PermissionSortBy
): FormPermissionSortBy | undefined {
    const parsed = zListFormPermissionsQuery.shape.sortBy.safeParse(value);
    return parsed.success ? parsed.data : undefined;
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
    const search = ref('');
    const sortOrder = ref<'asc' | 'desc'>('desc');
    const orderBy = ref<PermissionSortBy>('created');
    const loading = ref(false);
    const error = ref<string | null>(null);

    // ── Fetch permissions ────────────────────────────────────────────────

    async function fetchPermissions() {
        if (!resolvedId.value) return;
        loading.value = true;
        error.value = null;
        try {
            const params = { id: resolvedId.value };
            const page = currentPage.value;
            const page_size = pageSize.value;
            const searchVal = search.value || undefined;
            const sort_order = sortOrder.value;
            const result =
                resourceType === 'groups'
                    ? await orpc.groups.permissions.list({
                          params,
                          query: {
                              page,
                              page_size,
                              search: searchVal,
                              sort_order,
                              order_by: toGroupOrderBy(orderBy.value),
                          },
                      })
                    : await orpc.forms.permissions.list({
                          params,
                          query: {
                              page,
                              page_size,
                              search: searchVal,
                              sort_order,
                              sortBy: toFormSortBy(orderBy.value),
                          },
                      });
            permissions.value = result.data;
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
        role: ElementRole;
        user_id: string;
        expire?: string | null;
    }): Promise<PermissionEntry> {
        const router = resourceType === 'groups' ? orpc.groups : orpc.forms;
        return router.permissions.create({
            params: { id: resolvedId.value },
            body: {
                role: data.role,
                user_id: data.user_id,
                expire: data.expire ?? undefined,
            },
        });
    }

    // ── Patch permission ─────────────────────────────────────────────────

    async function patchPermission(
        permissionId: number,
        data: { role?: ElementRole; expire?: string | null }
    ): Promise<PermissionEntry> {
        const router = resourceType === 'groups' ? orpc.groups : orpc.forms;
        return router.permissions.patch({
            params: { id: resolvedId.value, permissionId },
            body: {
                role: data.role,
                expire: data.expire ?? undefined,
            },
        });
    }

    // ── Delete permission ────────────────────────────────────────────────

    async function deletePermission(permissionId: number): Promise<void> {
        const router = resourceType === 'groups' ? orpc.groups : orpc.forms;
        await router.permissions.delete({
            params: { id: resolvedId.value, permissionId },
        });
    }

    // ── Watchers ─────────────────────────────────────────────────────────

    watch(
        [currentPage, pageSize, search, sortOrder, orderBy, resolvedId],
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
        search,
        sortOrder,
        orderBy,
        loading,
        error,
        // Actions
        fetchPermissions,
        createPermission,
        patchPermission,
        deletePermission,
    };
}
