<script setup lang="ts">
import { BFormFile } from 'bootstrap-vue-next';
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';

const { formData } = storeToRefs(useFormDataStore());

const { layoutElement, jsonElement, savePath } = injectJsonData();
const id = controlID(savePath);
</script>

<template>
    <BFormFile
        v-model="formData[savePath]"
        :id="id"
        class="vjf_file"
        :multiple="layoutElement.options?.allowMultipleFiles"
        :accept="layoutElement.options?.acceptedFileType"
    />
</template>

<style scoped></style>
