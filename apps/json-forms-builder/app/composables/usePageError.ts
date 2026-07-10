/**
 * usePageError — Centralized error detection for API-loaded pages.
 *
 * Detects not-found (404) vs generic errors by inspecting the error object
 * and the status ref from useAsyncData.
 *
 * Handles both H3Error and oRPC (JSON-RPC) error shapes:
 *   H3Error:       { statusCode: 404, statusMessage: 'Not Found', message: '...' }
 *   oRPC via Nuxt: { statusCode: 500, data: { message: '...', code: -32004, data: { code: 'NOT_FOUND', httpStatus: 404 } } }
 *
 * Usage:
 *   const { data, error, status } = useAsyncData(...)
 *   const { isNotFound, hasError, errorMessage } = usePageError(error, status)
 *
 * Template:
 *   <template v-if="hasError">
 *     <BaseErrorState
 *       v-if="isNotFound"
 *       icon="warning-circle"
 *       :title="t('groups.notFound')"
 *       :description="errorMessage"
 *       :action-route="Routes.GROUPS"
 *       :action-label="t('groups.backToGroups')"
 *     />
 *     <BaseErrorState
 *       v-else
 *       icon="bug"
 *       :title="t('common.errorTitle')"
 *       :description="errorMessage"
 *       :action-route="Routes.GROUPS"
 *       :action-label="t('groups.backToGroups')"
 *     />
 *   </template>
 */

export function usePageError(
    error: MaybeRefOrGetter<any>,
    status?: MaybeRefOrGetter<string | undefined>
) {
    const resolvedError = computed(() => {
        const err = toValue(error);
        if (!err) return null;
        return err as Record<string, any>;
    });

    const resolvedStatus = computed(() => toValue(status));

    /** True when useAsyncData is in 'error' status OR an explicit error is set. */
    const hasError = computed(() => {
        if (resolvedError.value) return true;
        if (resolvedStatus.value === 'error') return true;
        return false;
    });

    // ── Deep-search helpers for oRPC / H3 / Nuxt error shapes ────────────

    // function deepGet(obj: any, ...keys: string[]): any {
    //     let cur = obj;
    //     for (const key of keys) {
    //         if (cur == null) return undefined;
    //         cur = cur[key];
    //     }
    //     return cur;
    // }

    const isNotFound = computed(() => {
        const err = resolvedError.value;
        if (!err) return false;

        // ── 1. Direct status checks ──
        if (err.statusCode === 404 || err.status === 404) return true;

        return false;
    });

    const errorMessage = computed(() => {
        const err = resolvedError.value;
        if (!err) return null;
        // Prefer the descriptive message from the response body
        return (
            err?.data?.message ??
            err.message ??
            err.statusMessage ??
            String(err)
        );
    });

    return {
        hasError,
        isNotFound,
        errorMessage,
        error: resolvedError,
    };
}
