<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { controlID } from '@/computedProperties/misc';
import { BFormInput, BFormTextarea, type InputType } from 'bootstrap-vue-next';
import { getStores, injectJsonData } from '@/computedProperties/json.ts';
import { StringControl } from '@/renderings/renderHelpers';

const { formDataStore } = getStores();

const { formData } = storeToRefs(formDataStore);

const { jsonElement, layoutElement, savePath } = injectJsonData();
const id = controlID(savePath);

const type = StringControl.getType(jsonElement, layoutElement);
</script>

<template>
    <BFormTextarea
        v-if="layoutElement.options?.multi"
        v-model="formData[savePath]"
        class="vjf_textarea"
        :id="id"
        :minlength="jsonElement.minLength"
        :maxlength="jsonElement.maxLength"
    />
    <b-form-input
        v-else
        v-model="formData[savePath]"
        class="vjf_input"
        :id="id"
        :minlength="jsonElement.minLength"
        :maxlength="jsonElement.maxLength"
        :step="jsonElement.multipleOf"
        :min="jsonElement.minimum"
        :max="jsonElement.maximum"
        :type="type"
        :pattern="jsonElement.pattern"
    />
</template>

<style scoped></style>
