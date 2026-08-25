import { computed } from 'vue';
import { useFormBuilder } from '../../../useFormBuilder';

/**
 * Shared logic for the element settings components.
 *
 * All settings components operate on the currently selected element and
 * reuse these typed getter/setter helpers instead of duplicating the
 * "read from data → write via updateElementField" plumbing. Field access is
 * `data as Record<string, unknown>` at the boundary — the components that
 * use a helper decide which schema field it maps to.
 */
export function useElementSettings() {
    const builder = useFormBuilder();

    /** Currently selected element (root Form included). */
    const element = computed(() => {
        const id = builder.selectedElementId.value;
        const fd = builder.formDefinition.value;
        if (!id) return null;
        if (!fd) return null;
        // root form is not in nodesIndex
        if (id === fd.root.uid) return fd.root;
        return fd.getElementById(id) ?? null;
    });

    function setField(field: string, value: unknown) {
        const el = element.value;
        if (!el) return;
        builder.updateElementField(el.uid, field, value);
    }

    /** Required string field — empty input writes '' (never undefined). */
    function stringField(field: string) {
        return computed({
            get: () => {
                const el = element.value;
                if (!el) return '';
                const v = (el.data as Record<string, unknown>)[field];
                return typeof v === 'string' ? v : '';
            },
            set: (v: string) => setField(field, v),
        });
    }

    /** Optional string field — empty input removes the value. */
    function optionalString(field: string) {
        return computed({
            get: () => {
                const el = element.value;
                if (!el) return '';
                const v = (el.data as Record<string, unknown>)[field];
                return typeof v === 'string' ? v : '';
            },
            set: (v: string) => setField(field, v === '' ? undefined : v),
        });
    }

    /** Optional number field — bound as string, '' removes the value. */
    function optionalNumber(field: string) {
        return computed({
            get: () => {
                const el = element.value;
                if (!el) return '';
                const v = (el.data as Record<string, unknown>)[field];
                return typeof v === 'number' ? String(v) : '';
            },
            set: (v: string) =>
                setField(field, v === '' ? undefined : Number(v)),
        });
    }

    /** Enum field — typed with the matching TS enum. */
    function enumField<T extends string>(field: string, fallback: T) {
        return computed({
            get: () => {
                const el = element.value;
                if (!el) return fallback;
                const v = (el.data as Record<string, unknown>)[field];
                return (typeof v === 'string' ? v : fallback) as T;
            },
            set: (v: T) => setField(field, v),
        });
    }

    /** Boolean field. */
    function booleanField(field: string, fallback = false) {
        return computed({
            get: () => {
                const el = element.value;
                if (!el) return fallback;
                const v = (el.data as Record<string, unknown>)[field];
                return typeof v === 'boolean' ? v : fallback;
            },
            set: (v: boolean) => setField(field, v),
        });
    }

    return {
        builder,
        element,
        setField,
        stringField,
        optionalString,
        optionalNumber,
        enumField,
        booleanField,
    };
}
