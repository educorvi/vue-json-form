<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { bootstrapComponents } from '@/renderings/bootstrap/BootstrapComponents';
import { BFormInput, BFormTextarea } from 'bootstrap-vue-next';

const { formData } = storeToRefs(useFormDataStore());

const { layoutElement, jsonElement } = injectJsonData();
const id = controlID(layoutElement);

const DateTimeControl = bootstrapComponents.DateTimeControl;
</script>

<template>
    <BFormTextarea
        v-if="layoutElement.options?.multi"
        v-model="formData[layoutElement.scope]"
        class="vjf_textarea"
        :id="id"
    />
    <date-time-control
        v-else-if="(layoutElement.options?.format || jsonElement.format) === 'date-time'"
    />
    <b-form-input
        v-else
        type="text"
        v-model="formData[layoutElement.scope]"
        class="vjf_input"
        :id="id"
    />
</template>

<style scoped></style>
