<script setup lang="ts">
import { BFormCheckboxGroup } from 'bootstrap-vue-next';
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { hasEnumValuesForItems } from '@/typings/typeValidators';

const { formData } = storeToRefs(useFormDataStore());

const { layoutElement, jsonElement, savePath } = injectJsonData();
const id = controlID(savePath);

let options: unknown[];
if (!hasEnumValuesForItems(jsonElement)) {
    options = [];
} else {
    options =
        jsonElement.items?.enum?.map((key) => {
            const textVals: Record<any, any> =
                layoutElement.options?.enumTitles || {};
            const text = textVals[key] || key;
            return { value: key, text };
        }) || [];
}
</script>

<template>
    <BFormCheckboxGroup
        v-model="formData[savePath]"
        :options="options"
        class="vjf_checkboxGroup"
        :id="id"
        :stacked="layoutElement.options?.stacked"
        :buttons="layoutElement.options?.displayAs === 'buttons'"
        :switches="layoutElement.options?.displayAs === 'switches'"
        :button-variant="layoutElement.options?.buttonVariant || 'primary'"
    />
</template>

<style scoped></style>
