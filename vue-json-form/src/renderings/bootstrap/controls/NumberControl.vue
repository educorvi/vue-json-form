<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { BFormInput } from 'bootstrap-vue-next';
import { computed } from 'vue';
import { getOption } from '@/utilities';

const { formData } = storeToRefs(useFormDataStore());

const { layoutElement, jsonElement, savePath } = injectJsonData();
const id = controlID(savePath);

const step = computed(() => {
    if (jsonElement.type === 'integer') {
        return jsonElement.multipleOf || 1;
    }
    return jsonElement.multipleOf || 0.0000000000000000000001;
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
        :type="getOption(layoutElement, 'range', false) ? 'range' : 'number'"
    />
</template>

<style scoped></style>
