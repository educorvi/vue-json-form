<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { controlID } from '@/computedProperties/misc';
import { BFormInput } from 'bootstrap-vue-next';
import { computed } from 'vue';
import { getOption } from '@/renderings/renderHelpers/utilities.ts';
import { getStores, injectJsonData } from '@/computedProperties/json.ts';
const { formDataStore } = getStores();
const { formData } = storeToRefs(formDataStore);

const { jsonElement, layoutElement, savePath } = injectJsonData();
const id = controlID(savePath);

const step = computed(() => {
    if (jsonElement.value.type === 'integer') {
        return jsonElement.value.multipleOf || 1;
    }
    return jsonElement.value.multipleOf || 0.0000000000000000000001;
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
