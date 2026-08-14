import { computed } from 'vue';
import { useFormBuilder } from '../useFormBuilder';
import type { CollabUser } from '@educorvi/vue-json-form-builder-schemas/collab';

/**
 * Editing presence for a single settings field of the currently selected
 * element.
 *
 *   - `editors` — remote users currently editing THIS field (shown as a
 *     small avatar widget next to the field).
 *   - `onFocus`/`onBlur` — announce the local user's editing state so
 *     other clients see who is typing in which field.
 */
export function useFieldEditingPresence(fieldName: string | undefined) {
    const builder = useFormBuilder();

    const editors = computed<CollabUser[]>(() => {
        if (!fieldName) return [];
        const elUid = builder.selectedElementId.value;
        if (!elUid) return [];
        return builder.remotePresences.value
            .filter(
                (p) =>
                    p.editing.elementId === elUid &&
                    p.editing.field === fieldName
            )
            .map((p) => p.user);
    });

    function onFocus() {
        if (!fieldName) return;
        builder.setEditingField(builder.selectedElementId.value, fieldName);
    }

    function onBlur() {
        builder.setEditingField(null, null);
    }

    return { editors, onFocus, onBlur };
}
