<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';

const { formData } = storeToRefs(useFormDataStore());

const { layoutElement, jsonElement, savePath } = injectJsonData();
const id = controlID(savePath);
</script>

<template>
    <textarea
        v-if="layoutElement.options?.multi"
        v-model="formData[layoutElement.scope]"
        class="vjf_textarea"
        :id="id"
    />
    <input
        v-else
        type="text"
        v-model="formData[layoutElement.scope]"
        class="vjf_input"
        :id="id"
    />
</template>

<style scoped></style>
