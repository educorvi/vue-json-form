<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { computedLabel, injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { BFormCheckbox, BFormTextarea } from 'bootstrap-vue-next';

const { formData } = storeToRefs(useFormDataStore());

const { layoutElement, savePath } = injectJsonData();
const id = controlID(savePath);

const label = computedLabel(layoutElement);
</script>

<template>
    <BFormCheckbox v-model="formData[savePath]" class="vjf_checkbox" :id="id">
        {{ label }}
    </BFormCheckbox>
</template>

<style scoped></style>
