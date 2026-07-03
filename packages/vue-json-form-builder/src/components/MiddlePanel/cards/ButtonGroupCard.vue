<script setup lang="ts">
import { computed } from 'vue';
import type { ButtonGroupElement, FormElement } from '@/types/formTypes';
import { wrapElement } from '@/types/elements/index';
import DropZone from './DropZone.vue';

const props = defineProps<{ element: ButtonGroupElement }>();

const node = computed(() => wrapElement(props.element));
const dropZone = computed(() => node.value.dropZone!);

const children = computed({
    get: () => node.value.children ?? [],
    set: (val: FormElement[]) => {
        node.value.children = val;
    },
});
</script>

<template>
    <DropZone
        v-model:children="children"
        :allowed-types="dropZone.allowedTypes"
        :layout="dropZone.layout"
        :empty-label="dropZone.emptyLabel"
        :parent-id="element._id"
    />
</template>
