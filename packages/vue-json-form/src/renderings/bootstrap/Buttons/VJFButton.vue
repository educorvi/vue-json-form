<script setup lang="ts">
import { BButton, BSpinner, type ButtonType } from 'bootstrap-vue-next';
import { computedCssClass } from '@/computedProperties/css';
import { storeToRefs } from 'pinia';
import type { VjfButtonProps } from '@/renderings/PropsAndEmitsForRenderings.ts';
import { getStores } from '@/computedProperties/json.ts';
import {
    getHtmlButtonType,
    getMaxPages,
    getWizardHandler,
} from '@/renderings/renderHelpers/Button.ts';

const { formStructureStore } = getStores();
const props = defineProps<VjfButtonProps>();
const {
    currentWizardPage,
    uiSchema,
    wizardValidateFunctions,
    formStateWasValidated,
} = storeToRefs(formStructureStore);

const cssClass = computedCssClass(props.layoutElement);
const buttonType = getHtmlButtonType(props.layoutElement);

const maxPages = getMaxPages(uiSchema);

const emitWizardButton = getWizardHandler(
    props.layoutElement,
    currentWizardPage,
    wizardValidateFunctions,
    formStateWasValidated,
    maxPages
);
</script>

<template>
    <b-button
        :variant="layoutElement.options?.variant"
        :type="buttonType"
        :class="cssClass"
        @click="emitWizardButton"
        :disabled="layoutElement.options?.disabled"
    >
        <span v-if="!waiting">
            {{ layoutElement.text }}
        </span>
        <span v-else> <b-spinner small /></span>
    </b-button>
</template>

<style scoped></style>
