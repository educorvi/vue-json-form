<script setup lang="ts">
import { storeToRefs } from 'pinia';
import {
    computedLabel,
    getStores,
    injectJsonData,
} from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { BFormCheckbox } from 'bootstrap-vue-next';
import HelpPopover from '@/renderings/bootstrap/HelpPopover.vue';

const { formDataStore } = getStores();

const { formData } = storeToRefs(formDataStore);

const { layoutElement, savePath } = injectJsonData();
const id = controlID(savePath);

const label = computedLabel(layoutElement);
</script>

<template>
    <BFormCheckbox :id="id" v-model="formData[savePath]" class="vjf_checkbox">
        {{ label }} <HelpPopover />
    </BFormCheckbox>
</template>

<style scoped></style>
