<script setup lang="ts">
import { BFormFile } from 'bootstrap-vue-next';
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
const { formData } = storeToRefs(useFormDataStore());

const { layoutElement, jsonElement } = injectJsonData();
const id = controlID(layoutElement);
</script>

<template>
    <BFormFile v-model="formData[layoutElement.scope]" :id="id" class="vjf_file" />
</template>

<style scoped></style>
