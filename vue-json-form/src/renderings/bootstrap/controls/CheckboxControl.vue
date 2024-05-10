<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computedLabel, injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { BFormCheckbox, BFormTextarea } from 'bootstrap-vue-next';
import { useFormStore } from '@/stores/formStore';

const { formData } = storeToRefs(useFormStore());

const { layoutElement, jsonElement, savePath } = injectJsonData();
const id = controlID(savePath);

const label = computedLabel(layoutElement);
</script>

<template>
    <BFormCheckbox v-model="formData[savePath]" class="vjf_checkbox" :id="id">
        {{ label }}
    </BFormCheckbox>
</template>

<style scoped></style>
