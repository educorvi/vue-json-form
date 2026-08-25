/**
 * usePageError — Centralized error detection for API-loaded pages.
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
