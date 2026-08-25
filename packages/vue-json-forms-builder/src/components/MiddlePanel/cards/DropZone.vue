<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { PhPlusCircle, PhXCircle } from '@phosphor-icons/vue';
import { VueDraggable } from 'vue-draggable-plus';
import { useFormBuilder } from '../../../useFormBuilder';
import {
    useDragState,
    setDragSource,
    setDragOverAncestorIds,
    setDragging,
    setDraggedElementId,
} from '../../../useDragState';
import {
    PALETTE_MARKER_PREFIX,
    type PaletteElementType,
} from '../../../types/paletteFields';
import CanvasNode from '../CanvasNode.vue';

const props = withDefaults(
    defineProps<{
        /** uid of the container (or root form) this zone belongs to. */
        parentUid: string;
        /** ordered uids of the container's children. */
        children: string[];
        /** how to lay out the children: 'vertical' | 'horizontal' | 'flex-row' */
        layout: 'vertical' | 'horizontal' | 'flex-row';
        /** element types accepted by this container ('*' accepts everything). */
        allowedTypes: string[] | '*';
        /** placeholder shown when the container is empty. */
        emptyLabel?: string;
        /** max number of children (arrays, e.g. wizard pages). */
        maxChildren?: number;
        /** root of the form — gets the big empty-state hint. */
        isRoot?: boolean;
    }>(),
    {
        emptyLabel: 'Drop elements here',
        isRoot: false,
        maxChildren: undefined,
    }
);

const builder = useFormBuilder();
const { dragging, dragSourceType, dragOverAncestorIds, draggedElementId } =
    useDragState();

// ── Local uid list (mutated by VueDraggable, re-synced from the definition) ──

const localChildren = ref<string[]>([...props.children]);

watch([() => props.children, () => builder.formDefinition.value], () => {
    localChildren.value = [...props.children];
});

const isDragging = computed(() => dragging.value);
/** Only the innermost zone the cursor is over is the drop target — the
 *  ancestor chain (outer containers) must NOT light up as well. */
const isDragOverThisZone = computed(
    () => dragOverAncestorIds.value[0] === props.parentUid
);

const canAccept = computed(() => {
    if (!isDragging.value) return false;
    const allowed = props.allowedTypes;
    if (allowed === '*') return true;
    const src = dragSourceType.value;
    if (!src) return true;
    return allowed.includes(src);
});

// Highlight only the currently hovered container while dragging.
const dropZoneActive = computed(
    () => isDragging.value && canAccept.value && isDragOverThisZone.value
);

const showBadDrop = computed(() => {
    if (!isDragOverThisZone.value) return false;
    const allowed = props.allowedTypes;
    if (allowed === '*') return false;
    const src = dragSourceType.value;
    return src !== null && !allowed.includes(src);
});

const group = computed(() => ({
    name: 'form-elements',
    put: (_to: any, _from: any, dragEl: HTMLElement) => {
        if (
            props.maxChildren !== undefined &&
            localChildren.value.length >= props.maxChildren
        ) {
            return false;
        }
        const allowed = props.allowedTypes;
        if (allowed === '*') return true;
        const domType = dragEl.dataset?.elementType ?? dragSourceType.value;
        if (!domType) return true;
        return allowed.includes(domType);
    },
}));

// ── Drag lifecycle ────────────────────────────────────────────────────────────

/** Collects the drop-zone ids the dragged element currently hovers over. */
function collectAncestorDropZoneIds(el: HTMLElement | null): string[] {
    const ids: string[] = [];
    let current: HTMLElement | null = el;
    while (current) {
        const id = current.getAttribute('data-drop-zone-id');
        if (id) ids.push(id);
        current = current.parentElement?.closest('[data-drop-zone-id]') ?? null;
    }
    return ids;
}

function onDragStart(e: any) {
    const item = e?.item as HTMLElement | undefined;
    const draggedId = item?.dataset?.elementId as string | undefined;
    const draggedType = item?.dataset?.elementType as string | undefined;

    setDragSource(draggedType ?? (draggedId ? 'element' : null));
    // Nothing is a drop target yet — the highlight appears only once the
    // drag actually hovers a container (see onDragMove).
    setDragOverAncestorIds([]);
    setDraggedElementId(draggedId ?? null);
    setDragging(true);

    // select the dragged element at drag start
    if (draggedId) {
        builder.selectElement(draggedId);
    }
    document.body.classList.add('sortable-drag-active');
}

function onDragMove(event: any) {
    try {
        const toEl = event?.to as HTMLElement | undefined;
        const ids = collectAncestorDropZoneIds(toEl ?? null);
        // Only skip the dragged element's own children zone (dropping into
        // yourself is blocked by SortableJS anyway).
        if (ids[0] === draggedElementId.value) {
            setDragOverAncestorIds([]);
        } else {
            setDragOverAncestorIds(ids);
        }
    } catch {
        // ignore move event errors
    }
    return true;
}

function onDragEnd() {
    setDragSource(null);
    setDragOverAncestorIds([]);
    setDraggedElementId(null);
    setDragging(false);
    document.body.classList.remove('sortable-drag-active');
}

// ── Applying mutations through the builder ───────────────────────────────────

/**
 * A new item landed in this zone (from the palette or from another zone).
 * VueDraggable has already spliced it into `localChildren` (palette clones
 * arrive as a `palette:<type>` marker string, see PaletteFieldGrid; moved
 * elements arrive as their uid). The reported `newIndex`/`newDraggableIndex`
 * can be off by one on empty lists (the empty-state placeholder occupies
 * child node 0), so we locate the item by content instead of trusting the
 * reported index.
 */
function onChildAdd(event: any) {
    // Palette drop → create a new element of the marked type
    const markerIdx = localChildren.value.findIndex(
        (c) => typeof c === 'string' && c.startsWith(PALETTE_MARKER_PREFIX)
    );
    if (markerIdx >= 0) {
        const paletteType = localChildren.value[markerIdx].slice(
            PALETTE_MARKER_PREFIX.length
        ) as PaletteElementType;
        const el = builder.addElement(props.parentUid, paletteType, markerIdx);
        if (el) builder.selectElement(el.uid);
        return;
    }

    // Element move (from another container) → move op
    const item = event.item as HTMLElement | undefined;
    const elementUid = item?.dataset?.elementId as string | undefined;
    if (elementUid) {
        const targetIdx = localChildren.value.indexOf(elementUid);
        builder.moveElement(
            elementUid,
            props.parentUid,
            targetIdx >= 0 ? targetIdx : 0
        );
    }
}

/** Reorder within this zone (same parent) → moveElement keeps the order. */
function onUpdate(event: any) {
    let idx = event.newDraggableIndex;
    if (typeof idx !== 'number') {
        idx = event.newIndex ?? event.oldIndex;
    }
    const elementUid = localChildren.value[idx];
    if (elementUid) {
        builder.moveElement(elementUid, props.parentUid, idx);
    }
}

// ── Layout classes (same as legacy) ──────────────────────────────────────────

const wrapperClass = computed(() => {
    if (props.layout === 'horizontal') return 'd-flex gap-2';
    if (props.layout === 'flex-row') return '';
    return 'vstack gap-2';
});

const paddedDraggableClass = computed(() => {
    if (props.layout === 'horizontal')
        return 'min-h-20 flex-grow-1 d-flex flex-row gap-3 flex-wrap py-2';
    if (props.layout === 'flex-row')
        return 'd-flex flex-row flex-wrap gap-3 min-h-14 py-2';
    return 'min-h-16 vstack gap-3 flex-grow-1 py-1';
});

const emptyClass = computed(() => {
    if (props.layout === 'flex-row')
        return 'd-flex align-items-center min-h-10 text-xs text-body-secondary pe-none flex-grow-1';
    if (props.layout === 'horizontal')
        return 'd-flex align-items-center justify-content-center min-h-14 text-xs text-body-secondary pe-none flex-grow-1 w-100';
    return 'd-flex align-items-center justify-content-center min-h-12 text-xs text-body-secondary pe-none flex-grow-1 w-100';
});
</script>

<template>
    <div
        class="p-2 position-relative"
        :data-drop-zone-id="parentUid"
        :class="wrapperClass"
    >
        <!-- Blocked-type overlay -->
        <Transition name="fade">
            <div
                v-if="showBadDrop"
                class="position-absolute top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center bg-danger bg-opacity-10 border border-danger border-2 rounded z-3 pe-none"
                style="border-style: dashed !important"
            >
                <span
                    class="d-flex align-items-center gap-1 text-danger text-xs fw-semibold"
                >
                    <PhXCircle :size="14" weight="bold" class="me-1" />
                    {{
                        allowedTypes === '*'
                            ? 'Any element'
                            : allowedTypes.join(', ') + ' only'
                    }}
                </span>
            </div>
        </Transition>

        <VueDraggable
            v-model="localChildren"
            :group="group"
            handle=".drag-handle"
            draggable=".canvas-element-wrapper"
            ghost-class="sortable-ghost"
            chosen-class="sortable-chosen"
            :animation="200"
            :class="paddedDraggableClass"
            @add="onChildAdd"
            @update="onUpdate"
            @start="onDragStart"
            @move="onDragMove"
            @end="onDragEnd"
            @click.stop
        >
            <CanvasNode
                v-for="childUid in localChildren"
                :key="childUid"
                :uid="childUid"
            />
        </VueDraggable>

        <!-- Empty-state hint: rendered OUTSIDE the SortableJS list (as an
             overlay) so it stays visible while hovering with a dragged
             element and is only removed once the element is actually
             dropped. -->
        <div
            v-if="localChildren.length === 0"
            :class="[
                emptyClass,
                'drop-zone-empty',
                { 'drop-zone-active': dropZoneActive },
            ]"
        >
            <slot name="empty">
                <PhPlusCircle
                    :size="12"
                    weight="bold"
                    class="me-1 opacity-50"
                />
                {{ emptyLabel }}
            </slot>
        </div>
    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.15s;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
