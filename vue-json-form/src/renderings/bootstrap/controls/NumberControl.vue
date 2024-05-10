<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { BFormInput } from 'bootstrap-vue-next';
import { useFormStore } from '@/stores/formStore';

const { formData } = storeToRefs(useFormStore());

const { layoutElement, jsonElement, savePath } = injectJsonData();
const id = controlID(savePath);
</script>

<template>
    <b-form-input
        type="number"
        v-model="formData[savePath]"
        class="vjf_input"
        :id="id"
    />
</template>

<style scoped></style>
