<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { bootstrapComponents } from '@/renderings/bootstrap/BootstrapComponents';
import { BFormInput, BFormTextarea } from 'bootstrap-vue-next';
import { computed } from 'vue';

const { formData } = storeToRefs(useFormDataStore());

const { layoutElement, jsonElement, savePath } = injectJsonData();
const id = controlID(savePath);

const type = computed(() => {
    return (
        layoutElement.options?.format ||
        jsonElement.format?.replace('date-time', 'datetime-local')
    );
});
</script>

<template>
    <BFormTextarea
        v-if="layoutElement.options?.multi"
        v-model="formData[savePath]"
        class="vjf_textarea"
        :id="id"
        :minlength="jsonElement.minLength"
        :maxlength="jsonElement.maxLength"
    />
    <b-form-input
        v-else
        v-model="formData[savePath]"
        class="vjf_input"
        :id="id"
        :minlength="jsonElement.minLength"
        :maxlength="jsonElement.maxLength"
        :step="jsonElement.multipleOf"
        :min="jsonElement.minimum"
        :max="jsonElement.maximum"
        :type="type"
    />
</template>

<style scoped></style>
