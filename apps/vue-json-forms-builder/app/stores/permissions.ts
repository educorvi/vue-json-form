/**
 * permissions – Central permission store.
 *
 * Single source of truth for "what can the current user do". All
 * capability checks reuse the backend policy definitions from
 * `server/lib/permissions` (`PermissionPolicy` + `ROLE_HIERARCHY`), so
 * when the access-control rules change server-side the UI updates
 * automatically.
 *
 * Global (admin) checks are derived from the session via
 * `useUserSession()`; resource-level checks take the caller's effective
 * role on the resource (see `useResourceAccess`).
 */
import { defineStore } from 'pinia';
import {
    ResourceCreateChildPermission,
    ResourceDeletePermission,
    ResourceManagePermissionsPermission,
    ResourceUpdatePermission,
    ResourceViewPermission,
    type Role,
} from '~~/server/lib/permissions';

type PolicyLike = { isSatisfiedByRole(role: Role | null): boolean };

export const usePermissionsStore = defineStore('permissions', () => {
    const { user } = useUserSession();

    /** Global role from the session — admins bypass every backend check. */
    const isAdmin = computed(
        () => user.value?.roles?.includes('admin') ?? false
    );

    // ── Root-level creation (mirrors groups/crud.ts + forms/crud.ts) ────────

    /** Root groups may only be created by admins. */
    const canCreateRootGroups = computed(() => isAdmin.value);
    /** Root forms may only be created by admins. */
    const canCreateRootForms = computed(() => isAdmin.value);

    // ── Resource-level policies (backend `PermissionPolicy` constants) ──────

    /**
     * Evaluate a backend policy against the user's effective role on a
     * resource. Admins always satisfy every policy (server-side they
     * bypass all checks), so `effectiveRole` is irrelevant for them.
     */
    function satisfies(
        policy: PolicyLike,
        effectiveRole: Role | null
    ): boolean {
        if (isAdmin.value) return true;
        return policy.isSatisfiedByRole(effectiveRole);
    }

    /** View a group/form (browse, see metadata, list children). */
    function canView(
        effectiveRole: Role | null,
        visibility: string | null | undefined
    ): boolean {
        if (isAdmin.value) return true;
        return ResourceViewPermission.isSatisfiedBy(
            effectiveRole,
            visibility ?? 'visible'
        );
    }

    /** Update title, description, visibility. */
    const canUpdate = (effectiveRole: Role | null) =>
        satisfies(ResourceUpdatePermission, effectiveRole);

    /** Delete the resource entirely. */
    const canDelete = (effectiveRole: Role | null) =>
        satisfies(ResourceDeletePermission, effectiveRole);

    /** Create sub-groups/forms inside a group. */
    const canCreateChildren = (effectiveRole: Role | null) =>
        satisfies(ResourceCreateChildPermission, effectiveRole);

    /** Manage permissions (add/remove/change other users' permissions). */
    const canManagePermissions = (effectiveRole: Role | null) =>
        satisfies(ResourceManagePermissionsPermission, effectiveRole);

    return {
        isAdmin,
        canCreateRootGroups,
        canCreateRootForms,
        canView,
        canUpdate,
        canDelete,
        canCreateChildren,
        canManagePermissions,
    };
});
