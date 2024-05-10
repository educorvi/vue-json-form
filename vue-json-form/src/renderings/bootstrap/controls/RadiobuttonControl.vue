<script setup lang="ts">
import { BFormRadioGroup } from 'bootstrap-vue-next';
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { hasEnum, hasEnumValuesForItems } from '@/typings/typeValidators';

const { formData } = storeToRefs(useFormDataStore());

const { layoutElement, jsonElement, savePath } = injectJsonData();
const id = controlID(savePath);
let options: unknown[];
if (!hasEnum(jsonElement)) {
    options = [];
} else {
    options =
        jsonElement.enum?.map((key: any) => {
            const textVals: Record<any, any> =
                layoutElement.options?.enumTitles || {};
            const text = textVals[key] || key;
            return { value: key, text };
        }) || [];
}
</script>

<template>
    <BFormRadioGroup
        v-model="formData[savePath]"
        :options="options"
        class="vjf_radioGroup w-100"
        :id="id"
        :buttons="layoutElement.options?.displayAs === 'buttons'"
        :button-variant="layoutElement.options?.buttonVariant || 'primary'"
        :stacked="layoutElement.options?.stacked"
    />
</template>

<style></style>
