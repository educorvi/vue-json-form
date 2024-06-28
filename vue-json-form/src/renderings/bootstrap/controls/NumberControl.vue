<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { BFormInput } from 'bootstrap-vue-next';
import { computed } from 'vue';

const { formData } = storeToRefs(useFormDataStore());

const { layoutElement, jsonElement, savePath } = injectJsonData();
const id = controlID(savePath);

const step = computed(() => {
    if (jsonElement.type === 'integer') {
        return jsonElement.multipleOf || 1;
    }
    return jsonElement.multipleOf;
});
</script>

<template>
    <b-form-input
        v-model.number="formData[savePath]"
        class="vjf_input"
        :id="id"
        :step="step"
        :min="jsonElement.minimum"
        :max="jsonElement.maximum"
    />
</template>

<style scoped></style>
