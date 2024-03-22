<script setup lang="ts">
import { BFormRadioGroup } from 'bootstrap-vue-next';
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';

const { formData } = storeToRefs(useFormDataStore());

const { layoutElement, jsonElement } = injectJsonData();
const id = controlID(layoutElement);
</script>

<template>
    <BFormRadioGroup
        v-model="formData[layoutElement.scope]"
        :options="jsonElement.enum"
        class="vjf_radioGroup w-100"
        :id="id"
        :buttons="layoutElement.options?.displayAs === 'buttons'"
        :button-variant="layoutElement.options?.buttonVariant || 'primary'"
    />
</template>

<style></style>
