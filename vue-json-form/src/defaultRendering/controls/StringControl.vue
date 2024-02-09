<script setup lang="ts">
import DateTimeControl from '@/defaultRendering/controls/DateTimeControl.vue';
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { inject } from 'vue';
import { controlID, injectJsonData } from '@/CommonFunctions';

const { formData } = storeToRefs(useFormDataStore());

const { layoutElement, jsonElement } = injectJsonData();
const id = controlID(layoutElement);
</script>

<template>
    <textarea
        v-if="layoutElement.options?.multi"
        v-model="formData[layoutElement.scope]"
        class="vjf_textarea"
        :id="id"
    />
    <date-time-control
        v-else-if="(layoutElement.options?.format || jsonElement.format) === 'date-time'"
    />
    <input v-else type="text" v-model="formData[layoutElement.scope]" class="vjf_input" :id="id" />
</template>

<style scoped></style>
