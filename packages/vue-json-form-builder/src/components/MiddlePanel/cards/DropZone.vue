<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { PhPlusCircle, PhXCircle } from '@phosphor-icons/vue';
import { VueDraggable } from 'vue-draggable-plus';
import { useFormStore } from '@/stores/formStore';
import type { FormElement } from '@/types/formTypes';

const CanvasElement = defineAsyncComponent(
    () => import('../CanvasElement.vue')
);

const props = withDefaults(
    defineProps<{
        children: FormElement[];
        allowedTypes: string[] | '*';
        layout: 'vertical' | 'horizontal' | 'flex-row';
        emptyLabel?: string;
        parentId: string;
        maxChildren?: number;
    }>(),
    {
        emptyLabel: 'Drop elements here',
    }
);

const emit = defineEmits<{
    'update:children': [children: FormElement[]];
    'child-add': [element: FormElement, index: number];
    'child-remove': [element: FormElement];
}>();

const store = useFormStore();

const model = computed({
    get: () => props.children,
    set: (val) => emit('update:children', val),
});

const isDragging = computed(() => store.dragSourceType !== null);
const isDragOverThisZone = computed(() =>
    store.dragOverAncestorIds.includes(props.parentId)
);

const canAccept = computed(() => {
    if (!isDragging.value) return false;
    if (props.allowedTypes === '*') return true;
    return (props.allowedTypes as string[]).includes(store.dragSourceType!);
});

// Highlight only the currently hovered container while dragging.
const dropZoneActive = computed(
    () => isDragging.value && canAccept.value && isDragOverThisZone.value
);

const showBadDrop = computed(() => {
    if (!isDragOverThisZone.value) return false;
    if (props.allowedTypes === '*') return false;
    const src = store.dragSourceType;
    return src !== null && !(props.allowedTypes as string[]).includes(src);
});

const group = computed(() => ({
    name: 'form-elements',
    put: (_to: any, _from: any, dragEl: HTMLElement) => {
        if (
            props.maxChildren !== undefined &&
            model.value.length >= props.maxChildren
        ) {
            return false;
        }
        if (props.allowedTypes === '*') return true;
        const domType = dragEl.dataset?.elementType ?? store.dragSourceType;
        if (!domType) return true;
        return (props.allowedTypes as string[]).includes(domType);
    },
}));

let _draggedEl: FormElement | null = null;

function onChildAdd(event: any) {
    const idx = event.newIndex ?? model.value.length - 1;
    const el = model.value[idx];
    if (!el) return;
    emit('child-add', el, idx);
    store.selectElement(el._id);
}

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
    const draggedId = e?.item?.dataset?.elementId as string | undefined;
    const draggedType = e?.item?.dataset?.elementType as string | undefined;
    const child = model.value[e.oldIndex];
    _draggedEl = child ?? null;
    store.setDragOverAncestorIds(collectAncestorDropZoneIds(e?.item ?? null));

    const sourceType = draggedType ?? child?.type ?? null;
    if (sourceType) {
        store.setDragSource(sourceType);
    }
    // Always select dragged element at drag start, even if it wasn't selected.
    if (draggedId) {
        store.selectElement(draggedId);
    } else if (child) {
        store.selectElement(child._id);
    }
    document.body.classList.add('sortable-drag-active');
}

function onDragMove(event: any) {
    try {
        const toEl = event?.to as HTMLElement | undefined;
        const targetEl = toEl?.dataset?.dropZoneId
            ? toEl
            : (toEl?.closest('[data-drop-zone-id]') ?? null);
        store.setDragOverAncestorIds(
            collectAncestorDropZoneIds(targetEl as HTMLElement | null)
        );
    } catch {
        // ignore move event errors
    }
    return true;
}

function onChildRemove() {
    if (_draggedEl) emit('child-remove', _draggedEl);
}

function onDragEnd() {
    _draggedEl = null;
    store.setDragSource(null);
    store.setDragOverAncestorIds([]);
    document.body.classList.remove('sortable-drag-active');
}

const wrapperClass = computed(() => {
    if (props.layout === 'horizontal') return 'd-flex gap-2';
    if (props.layout === 'flex-row') return '';
    return 'vstack gap-2';
});

// Increase gap and padding for better drop targets — makes it easier to
// drop elements between other elements or into containers.
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
        :data-drop-zone-id="parentId"
        :class="[wrapperClass, { 'drop-zone-active': dropZoneActive }]"
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
                            : (allowedTypes as string[]).join(', ') + ' only'
                    }}
                </span>
            </div>
        </Transition>

        <VueDraggable
            v-model="model"
            :group="group"
            handle=".drag-handle"
            draggable=".canvas-element-wrapper"
            ghost-class="sortable-ghost"
            chosen-class="sortable-chosen"
            :animation="200"
            :class="paddedDraggableClass"
            :data-drop-zone-id="parentId"
            @add="onChildAdd"
            @remove="onChildRemove"
            @start="onDragStart"
            @move="onDragMove"
            @end="onDragEnd"
            @click.stop
        >
            <CanvasElement
                v-for="child in model"
                :key="child._id"
                :element="child"
            />
            <div
                v-if="model.length === 0"
                :class="[emptyClass, 'drop-zone-empty']"
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
        </VueDraggable>
    </div>
</template>
