<script setup lang="ts">
import { controlID } from '@/computedProperties/misc';
import { BFormInput } from 'bootstrap-vue-next';
import { getOption } from '@/renderings/renderHelpers/utilities.ts';
import { getStores, injectJsonData } from '@/computedProperties/json.ts';
import {
    getStep,
    setupValueAndValidation,
} from '@/renderings/renderHelpers/NumberControl.ts';
const { formDataStore } = getStores();
const { jsonElement, layoutElement, savePath } = injectJsonData();
const id = controlID(savePath);

const props = defineProps<{
    required?: boolean;
}>();

const step = getStep(jsonElement);
const { state, value } = setupValueAndValidation(
    jsonElement,
    id.value,
    props.required
);
</script>

<template>
    <b-form-input
        :id="id"
        v-model="value"
        class="vjf_input"
        :step="step"
        :min="jsonElement.minimum"
        :max="jsonElement.maximum"
        :type="getOption(layoutElement, 'range', false) ? 'range' : 'number'"
        :required="required"
        :state="state"
    />
</template>

<style scoped></style>
