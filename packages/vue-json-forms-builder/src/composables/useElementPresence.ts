import { computed } from 'vue';
import { useFormBuilder } from '../useFormBuilder';
import type { CollabUser } from '@educorvi/vue-json-forms-builder-schemas/collab';

/**
 * Remote presence of OTHER users for a given element: who has it selected
 * (tree/canvas highlight) and who is editing one of its settings fields.
 *
 * Only the exact element is matched — ancestors of a remote selection are
 * intentionally NOT highlighted.
 */
export function useElementPresence(elementUid: string | null) {
    const builder = useFormBuilder();

    /** Users that currently have this element selected. */
    const selectors = computed<CollabUser[]>(() => {
        if (!elementUid) return [];
        return builder.remotePresences.value
            .filter((p) => p.selection.elementId === elementUid)
            .map((p) => p.user);
    });

    /** Users currently editing any settings field of this element. */
    const editors = computed<CollabUser[]>(() => {
        if (!elementUid) return [];
        return builder.remotePresences.value
            .filter((p) => p.editing.elementId === elementUid)
            .map((p) => p.user);
    });

    /** Users editing a specific settings field of this element. */
    function editorsOfField(field: string | undefined): CollabUser[] {
        if (!elementUid || !field) return [];
        return builder.remotePresences.value
            .filter(
                (p) =>
                    p.editing.elementId === elementUid &&
                    p.editing.field === field
            )
            .map((p) => p.user);
    }

    return { selectors, editors, editorsOfField };
}
