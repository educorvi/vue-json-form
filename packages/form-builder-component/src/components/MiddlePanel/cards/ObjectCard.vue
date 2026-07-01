<script setup lang="ts">
import { computed } from 'vue';
import { useFormStore } from '@/stores/formStore';
import type {
    ObjectElement,
    FormElement,
    ControlElement,
} from '@/types/formTypes';
import { wrapElement } from '@/types/elements/index';
import DropZone from './DropZone.vue';

const props = defineProps<{ element: ObjectElement }>();
const store = useFormStore();

const node = computed(() => wrapElement(props.element));
const dropZone = computed(() => node.value.dropZone!);

const children = computed({
    get: () => node.value.children ?? [],
    set: (val: FormElement[]) => {
        node.value.children = val;
    },
});

function onChildAdd(el: FormElement) {
    if (el.type === 'Control') {
        const key = (el as ControlElement).scope.split('/').pop();
        if (key) store.migrateSchemaToParent(key, props.element._id);
    }
}

function onChildRemove(el: FormElement) {
    if (el.type === 'Control') {
        const key = (el as ControlElement).scope.split('/').pop();
        if (key) store.migrateSchemaToRoot(key, props.element._id);
    }
}
</script>

<template>
    <DropZone
        v-model:children="children"
        :allowed-types="dropZone.allowedTypes"
        :layout="dropZone.layout"
        :empty-label="dropZone.emptyLabel"
        :parent-id="element._id"
        @child-add="onChildAdd"
        @child-remove="onChildRemove"
    />
</template>
