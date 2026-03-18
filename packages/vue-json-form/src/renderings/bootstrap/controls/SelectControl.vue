<script setup lang="ts">
import { BFormSelect } from 'bootstrap-vue-next';
import { storeToRefs } from 'pinia';
import { controlID } from '@/computedProperties/misc';
import { computed, watch } from 'vue';
import type { TitlesForEnum } from '@educorvi/vue-json-form-schemas';
import { getStores, injectJsonData } from '@/computedProperties/json.ts';
import { hasOption } from '@/typings/typeValidators.ts';
import {
    createInvalidValueWatch,
    getOptions,
} from '@/renderings/renderHelpers/SelectControl.ts';

const { formDataStore } = getStores();

const { formData } = storeToRefs(formDataStore);

const { jsonElement, layoutElement, savePath } = injectJsonData();

const id = controlID(savePath);

const options = getOptions(jsonElement, layoutElement);

createInvalidValueWatch(jsonElement, formData, savePath);
</script>

<template>
    <BFormSelect
        v-model="formData[savePath]"
        :options="options"
        class="vjf_select"
        :id="id"
    />
</template>

<style scoped></style>
