<script setup lang="ts">
import { computed, provide } from 'vue';
import { savePathOverrideProviderKey } from '@/components/ProviderKeys';
import Control from '@/components/LayoutElements/Control.vue';
import type { Control as ControlType, Layout } from '@/typings/ui-schema';
import { BButton } from 'bootstrap-vue-next';
import XIcon from '@/assets/icons/XIcon.vue';
import GripVerticalIcon from '@/assets/icons/GripVerticalIcon.vue';

const props = defineProps<{
    scope: string;
    index: number;
    itemID: string;
    baseSavePath: string;
    allowRemove: boolean;
    uiSchema?: ControlType;
}>();
const savePath = props.baseSavePath + '.' + props.itemID;
provide(savePathOverrideProviderKey, savePath);
const layoutElement = computed(() => {
    const uiSchema = props.uiSchema || {
        type: 'Control',
        scope: '',
        options: {
            label: false,
        },
    };
    uiSchema.scope = props.scope + '.' + props.itemID;
    return uiSchema;
});
const emit = defineEmits<{
    (e: 'delete', id: string, savePath: string): void;
}>();
</script>

<template>
    <div class="vjf_arrayItem" :id="itemID">
        <Control :layout-element="layoutElement">
            <template #prepend>
                <div class="handle">
                    <GripVerticalIcon />
                </div>
            </template>
            <template #append>
                <b-button
                    variant="outline-danger"
                    @click="emit('delete', itemID, savePath)"
                    :disabled="!allowRemove"
                    aria-label="Delete Item"
                >
                    <XIcon />
                </b-button>
            </template>
        </Control>
    </div>
</template>

<style scoped>
.handle {
    border: var(--bs-border-width) solid var(--bs-border-color);
    cursor: move;

    border-top-left-radius: var(--bs-border-radius);
    border-bottom-left-radius: var(--bs-border-radius);

    display: flex;
    justify-content: center;
    width: 40px;
}

.vjf_arrayItem > * {
    background: var(--bs-body-bg);
}
</style>
