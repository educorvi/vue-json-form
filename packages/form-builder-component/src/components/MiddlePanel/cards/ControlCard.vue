<script setup lang="ts">
import { computed } from 'vue';
import {
    supportedUiSchemaVersion,
    VueJsonForm,
    bootstrapComponents,
} from '@educorvi/vue-json-form';
import { useFormStore } from '@/stores/formStore';
import type { ControlElement } from '@/types/formTypes';

const props = defineProps<{ element: ControlElement }>();

const store = useFormStore();

const key = computed(() => props.element.scope.split('/').pop() ?? 'field');

const previewJsonSchema = computed(() => ({
    type: 'object',
    properties: {
        [key.value]: store.getControlSchemaProperty(props.element._id),
    },
    required: store.isControlRequired(props.element._id) ? [key.value] : [],
}));

const previewUiSchema = computed(() => ({
    version: supportedUiSchemaVersion,
    layout: {
        type: 'VerticalLayout',
        elements: [
            {
                type: 'Control',
                scope: props.element.scope,
                ...(props.element.options
                    ? { options: props.element.options }
                    : {}),
                ...(props.element.showOn
                    ? { showOn: props.element.showOn }
                    : {}),
            },
        ],
    },
}));
</script>

<template>
    <div class="px-3 pb-3 pt-1 canvas-preview">
        <vue-json-form
            :key="element._id"
            :json-schema="previewJsonSchema as any"
            :ui-schema="previewUiSchema as any"
            :render-interface="bootstrapComponents"
            :on-submit-form="async () => {}"
        />
    </div>
</template>
