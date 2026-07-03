/**
 * Breadcrumb store — manages the current page's breadcrumb trail.
 *
 * Pages push their breadcrumb entries on mount. The BasePage component
 * renders the trail automatically. Entries can be static labels or
 * dynamic (resolved from a reactive source like an API response).
 */
import { defineStore } from 'pinia';

export interface BreadcrumbEntry {
    /** Display label. Can be a ref for dynamic resolution. */
    label: string | (() => string);
    /** Route to navigate to. Omit for the current (last) entry. */
    route?: string;
    /** Phosphor icon name. Defaults to nothing. */
    icon?: string;
}

export const useBreadcrumbStore = defineStore('breadcrumb', () => {
    const trail = ref<BreadcrumbEntry[]>([]);

    /** Replace the entire breadcrumb trail. Call in page setup. */
    function set(items: BreadcrumbEntry[]) {
        trail.value = items;
    }

    /** Resolve a label whether it's a string or getter function. */
    function resolveLabel(entry: BreadcrumbEntry): string {
        if (typeof entry.label === 'function') return entry.label();
        return entry.label;
    }

    return { trail, set, resolveLabel };
});
