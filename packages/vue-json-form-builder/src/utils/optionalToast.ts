import { useToast } from 'bootstrap-vue-next';

/**
 * Like `useToast().show`, but never throws.
 *
 * bootstrap-vue-next's `useToast()` requires a toast orchestrator to be
 * installed in the host app (BApp, BToastOrchestrator or the plugin) —
 * otherwise it throws during setup. The builder library cannot rely on the
 * host providing one: inside the webcomponent's shadow DOM there is no
 * registry at all. With this helper, toasts silently no-op instead of
 * crashing the whole component (e.g. the Import dialog).
 */
export function useOptionalToastShow():
    ReturnType<typeof useToast>['show'] | undefined {
    try {
        return useToast().show;
    } catch {
        return undefined;
    }
}
