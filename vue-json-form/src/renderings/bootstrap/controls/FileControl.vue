<script setup lang="ts">
/* eslint-disable vue/no-deprecated-filter */
import { BFormFile } from 'bootstrap-vue-next';
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { getOption } from '@/utilities';

const { formData } = storeToRefs(useFormDataStore());

const { layoutElement, jsonElement, savePath } = injectJsonData();
const id = controlID(savePath);
</script>

<template>
    <BFormFile
        v-model="formData[savePath]"
        :id="id"
        class="vjf_file"
        :multiple="getOption(layoutElement, 'allowMultipleFiles', false)"
        :accept="
            getOption<string | undefined>(layoutElement, 'acceptedFileType')
        "
    />
</template>

<style scoped></style>
