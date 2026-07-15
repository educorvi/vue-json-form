<script setup lang="ts">
import { computed, ref } from 'vue';
import { BButton, BBadge } from 'bootstrap-vue-next';
import {
    PhClipboard,
    PhTrash,
    PhEye,
    PhEyeSlash,
    PhAsterisk,
} from '@phosphor-icons/vue';
import {
    supportedUiSchemaVersion,
    VueJsonForm,
    bootstrapComponents,
} from '@educorvi/vue-json-form';
import { useFormStore } from '@/stores/formStore';
import type { FormElement, ControlElement } from '@/types/formTypes';
import { wrapElement } from '@/types/elements/index';
import LayoutCard from './cards/LayoutCard.vue';
import ControlCard from './cards/ControlCard.vue';
import ObjectCard from './cards/ObjectCard.vue';
import ArrayCard from './cards/ArrayCard.vue';
import ButtonGroupCard from './cards/ButtonGroupCard.vue';
import WizardCard from './cards/WizardCard.vue';

const props = defineProps<{
    element: FormElement;
}>();

const store = useFormStore();

const hovered = ref(false);
const isDragging = computed(() => store.dragSourceType !== null);
const isDragOverContainer = computed(
    () => isDragging.value && store.dragOverContainerId === props.element._id
);

const isSelected = computed(
    () => store.selectedElementId === props.element._id
);
const isRootEl = computed(() => props.element._id === store.rootLayout._id);

// Outline: solid when selected, dashed when hovered, otherwise none
const outlineStyle = computed(() => {
    if (isSelected.value) return '2px solid var(--bs-primary)';
    if (isDragOverContainer.value) return '2px dashed var(--bs-primary)';
    if (isDragging.value) return '2px solid transparent';
    if (hovered.value) return '2px dashed var(--bs-primary)';
    return '2px solid transparent';
});

const node$ = computed(() => wrapElement(props.element));
const fieldIcon = computed(() => node$.value.icon);
const fieldLabel = computed(() =>
    node$.value.getLabel(store.jsonSchema as any)
);

const controlType = computed(() => {
    if (props.element.type !== 'Control') return null;
    const schemaProp = store.getControlSchemaProperty(props.element._id);
    return (schemaProp as any).type ?? 'string';
});

const isFieldRequired = computed(() => {
    if (props.element.type !== 'Control') return false;
    return store.isControlRequired(props.element._id);
});

const bodyCard = computed(() => {
    switch (props.element.type) {
        case 'VerticalLayout':
        case 'HorizontalLayout':
        case 'Group':
            return LayoutCard;
        case 'Control':
            return ControlCard;
        case 'Object':
            return ObjectCard;
        case 'Array':
            return ArrayCard;
        case 'ButtonGroup':
            return ButtonGroupCard;
        case 'Wizard':
            return WizardCard;
        default:
            return null;
    }
});

function toVjfEl(el: FormElement): Record<string, unknown> {
    const { _id, ...rest } = el as any;
    return rest;
}

const leafPreviewUiSchema = computed(() => ({
    version: supportedUiSchemaVersion,
    layout: { type: 'VerticalLayout', elements: [toVjfEl(props.element)] },
}));

const leafPreviewJsonSchema = { type: 'object', properties: {} };

function select(e: Event) {
    e.stopPropagation();
    store.selectElement(props.element._id);
}

function deleteEl(e: Event) {
    e.stopPropagation();
    store.removeElement(props.element._id);
}

function duplicate(e: Event) {
    e.stopPropagation();
    store.duplicateElement(props.element._id);
}

function onMouseEnter() {
    if (!isDragging.value) hovered.value = true;
}

function onMouseLeave() {
    hovered.value = false;
}
</script>

<template>
    <div
        class="canvas-element-wrapper"
        :class="{ selected: isSelected }"
        :data-element-type="element.type"
        :data-element-id="element._id"
        :style="{
            outline: outlineStyle,
            outlineOffset: '2px',
            borderRadius: '6px',
            transition: 'outline-color 0.15s, outline-style 0.15s',
        }"
        @mouseenter="onMouseEnter"
        @mouseleave="onMouseLeave"
        @click="select"
    >
        <div class="canvas-element-inner rounded overflow-hidden">
            <!-- Header -->
            <div
                :class="[
                    'canvas-element-header d-flex align-items-center gap-2 px-2 py-1 bg-body-tertiary',
                    isRootEl ? '' : 'drag-handle',
                    isSelected ? 'bg-primary-subtle border-primary' : '',
                ]"
            >
                <i :class="fieldIcon" class="text-xs text-body flex-shrink-0" />
                <span
                    class="text-xs fw-medium text-body text-truncate flex-grow-1"
                    >{{ fieldLabel }}</span
                >

                <!-- Data type badge -->
                <BBadge
                    v-if="element.type === 'Control' && controlType"
                    class="text-body text-xs flex-shrink-0"
                    >{{ controlType }}</BBadge
                >

                <!-- ShowOn indicator -->
                <PhEye
                    v-if="(element as any).showOn"
                    :size="12"
                    class="text-warning flex-shrink-0"
                    weight="bold"
                    title="Visibility condition"
                />

                <!-- Required indicator -->
                <PhAsterisk
                    v-if="isFieldRequired"
                    :size="12"
                    class="text-danger flex-shrink-0"
                    weight="bold"
                    title="Required field"
                />

                <!-- Hidden indicator -->
                <PhEyeSlash
                    v-if="
                        element.type === 'Control' &&
                        (element as ControlElement).options?.hidden
                    "
                    :size="12"
                    class="text-body flex-shrink-0"
                    weight="bold"
                    title="Hidden element"
                />

                <!-- Actions when selected and not root -->
                <div
                    v-if="isSelected && !isRootEl"
                    class="d-flex align-items-center gap-1 flex-shrink-0 ms-1"
                    @click.stop
                >
                    <div class="vr" />
                    <b-button
                        variant="link"
                        class="p-0 border-0 text-body text-decoration-none"
                        style="width: 1.25rem; height: 1.25rem; line-height: 1"
                        title="Duplicate"
                        @click="duplicate"
                    >
                        <PhClipboard :size="12" weight="bold" />
                    </b-button>
                    <b-button
                        variant="link"
                        class="p-0 border-0 text-danger text-decoration-none"
                        style="width: 1.25rem; height: 1.25rem; line-height: 1"
                        title="Delete"
                        @click="deleteEl"
                    >
                        <PhTrash :size="12" weight="bold" />
                    </b-button>
                </div>
            </div>

            <!-- Body -->
            <div v-if="bodyCard" class="border-top">
                <component
                    :is="bodyCard"
                    :element="element as any"
                    :is-root="isRootEl"
                />
            </div>

            <!-- Leaf element preview -->
            <div v-else class="border-top px-3 py-2 canvas-preview">
                <VueJsonForm
                    :key="element._id"
                    :json-schema="leafPreviewJsonSchema as any"
                    :ui-schema="leafPreviewUiSchema as any"
                    :render-interface="bootstrapComponents"
                    :on-submit-form="async () => {}"
                />
            </div>
        </div>
    </div>
</template>
