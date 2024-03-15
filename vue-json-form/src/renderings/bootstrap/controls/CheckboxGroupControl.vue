<script setup lang="ts">
import { BFormCheckboxGroup } from 'bootstrap-vue-next';
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';

const { formData } = storeToRefs(useFormDataStore());

const { layoutElement, jsonElement } = injectJsonData();
const id = controlID(layoutElement);

let options: unknown[];
if (typeof jsonElement.items !== 'object' || !('enum' in jsonElement.items)) {
    options = [];
} else {
    options =
        jsonElement.items?.enum?.map((key) => {
            const text = key;
            return { value: key, text };
        }) || [];
}
</script>

<template>
    <BFormCheckboxGroup
        v-model="formData[layoutElement.scope]"
        :options="options"
        class="vjf_checkboxGroup"
        :id="id"
        :stacked="layoutElement.options?.stacked"
    />
</template>

<style scoped></style>
