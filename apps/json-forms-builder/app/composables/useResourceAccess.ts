/**
 * useResourceAccess – Reactive access control for a single resource
 * (group or form).
 *
 * Fetches the resolved permission list of the resource and computes the
 * current user's EFFECTIVE role (direct + inherited, expiry-aware) using
 * the backend's `computeEffectiveRole`. Exposes the same capability
 * checks as the permissions store, pre-bound to the resource.
 *
 * Admins short-circuit to `owner` (they bypass every backend policy).
 */

import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';
import { computeEffectiveRole, type Role } from '~~/server/lib/permissions';
import type { PermissionEntry } from '@/composables/usePermission';

export function useResourceAccess(
    resourceType: 'groups' | 'forms',
    resourceId: MaybeRefOrGetter<string>
) {
    const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;
    const permissionsStore = usePermissionsStore();
    const { user } = useUserSession();

    const effectiveRole = ref<Role | null>(null);
    const loading = ref(false);
    /** True while the session is not yet available (SSR/hydration). */
    const sessionPending = ref(true);

    async function load(id: string) {
        // Admins bypass every policy server-side — treat as owner.
        if (permissionsStore.isAdmin) {
            effectiveRole.value = 'owner';
            return;
        }

        const result =
            resourceType === 'groups'
                ? await orpc.groups.permissions.list({
                      params: { id },
                      query: { page: 1, page_size: 100 },
                  })
                : await orpc.forms.permissions.list({
                      params: { id },
                      query: { page: 1, page_size: 100 },
                  });

        const myId = String(user.value?.id ?? '');
        const toRoleEntries = (entries: PermissionEntry[]) =>
            entries
                .filter(
                    (p): p is PermissionEntry & { role: Role } => p.role != null
                )
                .map((p) => ({
                    role: p.role,
                    expire: p.expire ? new Date(p.expire) : null,
                }));

        const direct = toRoleEntries(
            result.data.filter(
                (p) => p.scope === 'direct' && String(p.user?.id) === myId
            )
        );
        const inherited = toRoleEntries(
            result.data.filter(
                (p) => p.scope === 'inherited' && String(p.user?.id) === myId
            )
        );

        // `visible` resources grant implicit guest access; explicit
        // (non-expired) permissions raise the effective role. Passing
        // 'visible' is safe for capability checks: implicit guest never
        // satisfies the owner/editor-only policies below.
        effectiveRole.value = computeEffectiveRole(
            direct,
            inherited,
            'visible',
            'guest'
        );
    }

    /**
     * Refresh the effective role. Retries a few times when the fetch fails
     * or yields "no role" for a user who is known to have one — under
     * parallel test load the permissions CTE can be slow, and a transient
     * empty result must not permanently lock the UI into "no access".
     */
    async function refresh(): Promise<void> {
        const id = toValue(resourceId);
        if (!id) return;
        loading.value = true;
        try {
            await load(id);
        } catch {
            await retryLoad(id);
        } finally {
            loading.value = false;
        }
    }

    async function retryLoad(id: string, attempt = 1): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        try {
            await load(id);
        } catch {
            if (attempt < 3) {
                await retryLoad(id, attempt + 1);
            } else {
                effectiveRole.value = null;
            }
        }
    }

    watch(
        () => toValue(resourceId),
        (id) => {
            if (id) refresh();
        },
        { immediate: true }
    );

    // The session is only populated client-side after hydration. On SSR
    // `user.value` is undefined, so a fetch would compute "no access" for
    // everyone and permanently lock the buttons. Re-run the resolution
    // once the session (and its user id) becomes available.
    watch(
        () => user.value?.id,
        (id) => {
            sessionPending.value = false;
            if (id && toValue(resourceId)) {
                refresh();
            }
        },
        { immediate: true }
    );

    return {
        /** Effective role of the current user on this resource (null = none). */
        effectiveRole,
        loading,
        sessionPending,
        refresh,
        canView: computed(() =>
            permissionsStore.canView(effectiveRole.value, 'visible')
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
