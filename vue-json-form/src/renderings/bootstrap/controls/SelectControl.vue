<script setup lang="ts">
import { BFormSelect } from 'bootstrap-vue-next';
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';

const { formData } = storeToRefs(useFormDataStore());

const { layoutElement, jsonElement, savePath } = injectJsonData();
const id = controlID(savePath);
</script>

<template>
    <BFormSelect
        v-model="formData[savePath]"
        :options="jsonElement.enum"
        class="vjf_select"
        :id="id"
    />
</template>

<style scoped></style>
