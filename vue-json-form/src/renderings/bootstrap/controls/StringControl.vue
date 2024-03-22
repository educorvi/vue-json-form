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
</script>

<template>
    <BFormTextarea
        v-if="layoutElement.options?.multi"
        v-model="formData[layoutElement.scope]"
        class="vjf_textarea"
        :id="id"
    />
    <b-form-input
        v-else
        :type="
            layoutElement.options?.type ||
            jsonElement.format?.replace('date-time', 'datetime-local') ||
            'text'
        "
        v-model="formData[layoutElement.scope]"
        class="vjf_input"
        :id="id"
    />
</template>

<style scoped></style>
