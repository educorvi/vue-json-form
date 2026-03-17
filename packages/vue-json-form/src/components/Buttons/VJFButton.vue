<script setup lang="ts">
import type { Button } from '@educorvi/vue-json-form-schemas';
import { computed } from 'vue';
import { BButton } from 'bootstrap-vue-next';
import { generateUUID } from '@/Commons';
import { storeToRefs } from 'pinia';
import { getStores } from '@/computedProperties/json.ts';

const props = defineProps<{
    /**
     * The UI Schema of this Element
     */
    layoutElement: Button;
}>();

const id = generateUUID();

const { formStructureStore } = getStores();

const { buttonWaiting } = storeToRefs(formStructureStore);

buttonWaiting.value[id] = false;

const buttonComponent = formStructureStore.getComponent('Button');
const submitOptions = computed(() => {
    const json = JSON.stringify({
        ...props.layoutElement.options?.submitOptions,
        id,
    });
    return encodeURIComponent(json);
});
</script>

<template>
    <component
        :is="buttonComponent"
        :layoutElement="layoutElement"
        :submitOptions="submitOptions"
        :formnovalidate="
            layoutElement.options?.formnovalidate ? 'formnovalidate' : undefined
        "
        :waiting="buttonWaiting[id]"
    />
</template>

<style scoped></style>
