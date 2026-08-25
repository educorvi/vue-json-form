/**
 * Shared drag & drop state for the builder canvas.
 *
 * Drop zones are only rendered while a drag is actually in progress
 * (previously they were permanently visible, which looked broken).
 *
 * Mirrors the legacy formStore drag API (dragSourceType / dragOverAncestorIds)
 * so the restored cards/DropZone can highlight the container currently being
 * hovered and block drops into containers that reject the dragged type.
 */
import { ref } from 'vue';

export const PALETTE_MIME = 'application/x-vjfb-palette';
export const ELEMENT_MIME = 'application/x-vjfb-element';

const dragging = ref(false);
/** 'string' | 'number' | 'array' | 'object' for palette drags, 'element' for moves. */
const dragSourceType = ref<string | null>(null);
/** Container uids the drag is currently over — the innermost entry (index 0)
 *  is the actual drop target. */
const dragOverAncestorIds = ref<string[]>([]);
/** uid of the element being moved (null for palette drags). */
const draggedElementId = ref<string | null>(null);

export function useDragState() {
    return {
        dragging,
        dragSourceType,
        dragOverAncestorIds,
        draggedElementId,
    };
}

export function setDragging(value: boolean): void {
    dragging.value = value;
    document.body.classList.toggle('is-dragging-builder', value);
}

export function setDragSource(type: string | null): void {
    dragSourceType.value = type;
}

export function setDragOverAncestorIds(ids: string[]): void {
    dragOverAncestorIds.value = ids;
}

export function setDraggedElementId(id: string | null): void {
    draggedElementId.value = id;
}
