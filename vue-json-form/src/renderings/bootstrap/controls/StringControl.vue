<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { bootstrapComponents } from '@/renderings/bootstrap/BootstrapComponents';
import { BFormInput, BFormTextarea } from 'bootstrap-vue-next';
import { useFormStore } from '@/stores/formStore';

const { formData } = storeToRefs(useFormStore());

const { layoutElement, jsonElement, savePath } = injectJsonData();
const id = controlID(savePath);
</script>

<template>
    <BFormTextarea
        v-if="layoutElement.options?.multi"
        v-model="formData[savePath]"
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
        v-model="formData[savePath]"
        class="vjf_input"
        :id="id"
    />
</template>

<style scoped></style>
