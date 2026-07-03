<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
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

const showBadDrop = computed(() => {
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

function onDragStart(e: any) {
    const child = model.value[e.oldIndex];
    _draggedEl = child ?? null;
    if (child) store.setDragSource(child.type);
}

function onChildRemove() {
    if (_draggedEl) emit('child-remove', _draggedEl);
}

function onDragEnd() {
    _draggedEl = null;
    store.setDragSource(null);
}

const wrapperClass = computed(() => {
    if (props.layout === 'horizontal') return 'd-flex gap-2';
    if (props.layout === 'flex-row') return '';
    return 'vstack gap-2';
});

const draggableClass = computed(() => {
    if (props.layout === 'horizontal')
        return 'min-h-14 flex-grow-1 d-flex flex-row gap-2 flex-wrap';
    if (props.layout === 'flex-row')
        return 'd-flex flex-row flex-wrap gap-2 min-h-10';
    return 'min-h-12 vstack gap-2 flex-grow-1';
});

const emptyClass = computed(() => {
    if (props.layout === 'flex-row')
        return 'd-flex align-items-center min-h-10 text-xs text-body pe-none';
    if (props.layout === 'horizontal')
        return 'd-flex align-items-center justify-content-center min-h-14 text-xs text-body pe-none';
    return 'd-flex align-items-center justify-content-center min-h-12 text-xs text-body pe-none';
});
</script>

<template>
    <div class="p-2 position-relative" :class="wrapperClass">
        <!-- Blocked-type overlay -->
        <Transition name="fade">
            <div
                v-if="showBadDrop"
                class="position-absolute top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center bg-danger bg-opacity-10 border border-danger border-2 rounded z-3 pe-none"
                style="border-style: dashed !important"
            >
                <span class="d-flex align-items-center gap-1 text-danger text-xs fw-semibold">
                    <i class="bi bi-x-circle" />
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
            :animation="150"
            :class="draggableClass"
            @add="onChildAdd"
            @remove="onChildRemove"
            @start="onDragStart"
            @end="onDragEnd"
            @click.stop
        >
            <CanvasElement
                v-for="child in model"
                :key="child._id"
                :element="child"
                :parent-id="parentId"
            />
            <div v-if="model.length === 0" :class="emptyClass">
                <slot name="empty">
                    <i class="bi bi-plus-circle me-1 opacity-50" />
                    {{ emptyLabel }}
                </slot>
            </div>
        </VueDraggable>
    </div>
</template>
