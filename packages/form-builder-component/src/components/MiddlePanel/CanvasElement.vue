<script setup lang="ts">
import { computed } from 'vue';
import { BButton, BBadge } from 'bootstrap-vue-next';
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
    parentId: string;
}>();

const store = useFormStore();

const isSelected = computed(
    () => store.selectedElementId === props.element._id
);
const isRootEl = computed(() => props.element._id === store.rootLayout._id);

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
</script>

<template>
    <div
        class="canvas-element-wrapper"
        :class="{ selected: isSelected }"
        :data-element-type="element.type"
        @click="select"
    >
        <div class="canvas-element-inner rounded overflow-hidden">
            <!-- Header -->
            <div
                :class="[
                    'd-flex align-items-center gap-2 px-2 py-1',
                    isRootEl
                        ? 'bg-body-secondary'
                        : 'drag-handle bg-body-secondary',
                    isSelected ? 'bg-primary bg-opacity-10' : '',
                ]"
            >
                <i :class="fieldIcon" class="text-xs text-body flex-shrink-0" />
                <span
                    class="text-xs fw-medium text-body text-truncate flex-grow-1"
                    >{{ fieldLabel }}</span
                >

                <!-- Data type badge -->
                <b-badge
                    v-if="element.type === 'Control' && controlType"
                    variant="secondary"
                    class="bg-opacity-25 text-body text-xs flex-shrink-0"
                    >{{ controlType }}</b-badge
                >

                <!-- ShowOn indicator -->
                <i
                    v-if="(element as any).showOn"
                    class="bi bi-eye text-xs text-warning flex-shrink-0"
                    title="Visibility condition"
                />

                <!-- Required indicator -->
                <i
                    v-if="isFieldRequired"
                    class="bi bi-asterisk text-xs text-danger flex-shrink-0"
                    title="Required field"
                />

                <!-- Hidden indicator -->
                <i
                    v-if="
                        element.type === 'Control' &&
                        (element as ControlElement).options?.hidden
                    "
                    class="bi bi-eye-slash text-xs text-body flex-shrink-0"
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
                        <i class="bi bi-clipboard text-xs" />
                    </b-button>
                    <b-button
                        variant="link"
                        class="p-0 border-0 text-danger text-decoration-none"
                        style="width: 1.25rem; height: 1.25rem; line-height: 1"
                        title="Delete"
                        @click="deleteEl"
                    >
                        <i class="bi bi-trash text-xs" />
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
