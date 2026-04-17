<script setup lang="ts">
import { BFormRadioGroup } from 'bootstrap-vue-next';
import { storeToRefs } from 'pinia';
import { controlID } from '@/computedProperties/misc';
import { getOption } from '@/renderings/renderHelpers/utilities.ts';
import { getStores, injectJsonData } from '@/computedProperties/json.ts';
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
    <BFormRadioGroup
        :id="id"
        v-model="formData[savePath]"
        :options="options"
        class="vjf_radioGroup w-100"
        :buttons="getOption(layoutElement, 'displayAs') === 'buttons'"
        :button-variant="getOption(layoutElement, 'buttonVariant') || 'primary'"
        :stacked="getOption(layoutElement, 'stacked')"
    />
</template>

<style scoped>
.vjf_radioGroup {
    position: relative;
    display: block;
}
</style>
