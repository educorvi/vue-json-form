<script setup lang="ts">
import { computed, provide } from 'vue';
import { savePathOverrideProviderKey } from '@/components/ProviderKeys';
import Control from '@/components/LayoutElements/Control.vue';
import type { Control as ControlType } from '@/typings/ui-schema';
import { BButton } from 'bootstrap-vue-next';
import XIcon from '@/assets/icons/XIcon.vue';
import GripVerticalIcon from '@/assets/icons/GripVerticalIcon.vue';

const props = defineProps<{
    scope: string;
    index: number;
    itemID: string;
    baseSavePath: string;
}>();
const savePath = props.baseSavePath + '.' + props.itemID;
provide(savePathOverrideProviderKey, savePath);
const layoutElement = computed(() => {
    const l: ControlType = {
        type: 'Control',
        scope: props.scope + '/items',
        options: {
            label: false,
        },
    };
    return l;
});
const emit = defineEmits<{
    (e: 'delete', id: string, savePath: string): void;
}>();
</script>

<template>
    <div class="vjf_arrayItem" :id="itemID">
        <Control :layout-element="layoutElement">
            <template #prepend>
                <b-button class="handle" variant="light">
                    <GripVerticalIcon />
                </b-button>
            </template>
            <template #append>
                <b-button
                    variant="outline-danger"
                    @click="emit('delete', itemID, savePath)"
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
}
</style>
