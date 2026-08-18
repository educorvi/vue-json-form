/**
 * useResourceAccess – Reactive access control for a single resource
 * (group or form).
 *
 * The server computes the calling user's effective role (direct +
 * inherited permissions, expiry-aware, admin → owner) and embeds it in
 * the `groups.get` / `forms.get` responses as `effective_role`. This
 * composable only maps that role through the backend capability
 * policies (reused from `server/lib/permissions`), pre-bound to the
 * resource.
 */
import type { Role } from '~~/server/lib/permissions';

/** A group/form payload as returned by `groups.get` / `forms.get`. */
export interface ResourceWithAccess {
    effective_role: Role | null;
    visibility?: string | null;
    /** True when the caller is an owner and no other user has owner access. */
    is_only_owner?: boolean;
    /** Visibility of the parent group (null for root resources). */
    parent_visibility?: string | null;
}

export function useResourceAccess(
    resource: MaybeRefOrGetter<ResourceWithAccess | null | undefined>
) {
    const permissionsStore = usePermissionsStore();

    const effectiveRole = computed(
        () => toValue(resource)?.effective_role ?? null
    );
    const visibility = computed(
        () => toValue(resource)?.visibility ?? 'visible'
    );
    const isOnlyOwner = computed(
        () => toValue(resource)?.is_only_owner ?? false
    );
    const parentVisibility = computed(
        () => toValue(resource)?.parent_visibility ?? null
    );

    return {
        /** Effective role of the current user on this resource (null = none). */
        effectiveRole,
        /** True when the caller is the only owner of this resource. */
        isOnlyOwner,
        /** Visibility of the parent group (null = root resource). */
        parentVisibility,
        canView: computed(() =>
            permissionsStore.canView(effectiveRole.value, visibility.value)
        ),
        canUpdate: computed(() =>
            permissionsStore.canUpdate(effectiveRole.value)
        ),
        canDelete: computed(() =>
            permissionsStore.canDelete(effectiveRole.value)
        ),
        canCreateChild: computed(() =>
            permissionsStore.canCreateChildren(effectiveRole.value)
        ),
        canManagePermissions: computed(() =>
            permissionsStore.canManagePermissions(effectiveRole.value)
        ),
    };
}
