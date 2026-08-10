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

    return {
        /** Effective role of the current user on this resource (null = none). */
        effectiveRole,
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
