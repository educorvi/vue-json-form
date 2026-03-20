<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { controlID } from '@/computedProperties/misc';
import { BFormInput } from 'bootstrap-vue-next';
import { getOption } from '@/renderings/renderHelpers/utilities.ts';
import { getStores, injectJsonData } from '@/computedProperties/json.ts';
import { getStep } from '@/renderings/renderHelpers/NumberControl.ts';
const { formDataStore } = getStores();
const { formData } = storeToRefs(formDataStore);

const { jsonElement, layoutElement, savePath } = injectJsonData();
const id = controlID(savePath);

const step = getStep(jsonElement);
</script>

<template>
    <b-form-input
        :id="id"
        v-model.number="formData[savePath]"
        class="vjf_input"
        :step="step"
        :min="jsonElement.minimum"
        :max="jsonElement.maximum"
        :type="getOption(layoutElement, 'range', false) ? 'range' : 'number'"
    />
</template>

<style scoped></style>
