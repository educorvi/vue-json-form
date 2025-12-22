<script setup lang="ts">
import { BButton, BSpinner, type ButtonType } from 'bootstrap-vue-next';
import { computedCssClass } from '@/computedProperties/css';
import { computed, type ComputedRef } from 'vue';
import { storeToRefs } from 'pinia';
import { useFormStructureStore } from '@/stores/formStructure.ts';
import type { VjfButtonProps } from '@/renderings/PropsAndEmitsForRenderings.ts';

const props = defineProps<VjfButtonProps>();
const {
    currentWizardPage,
    uiSchema,
    wizardValidateFunctions,
    formStateWasValidated,
} = storeToRefs(useFormStructureStore());

const cssClass = computedCssClass(props.layoutElement);
const buttonType: ComputedRef<ButtonType | undefined> = computed(() => {
    if (
        ['submit', 'reset', 'button'].includes(props.layoutElement.buttonType)
    ) {
        return props.layoutElement.buttonType as ButtonType;
    } else {
        return undefined;
    }
});

const maxPages = computed(() => {
    if (uiSchema.value?.type !== 'Wizard') return Number.MAX_SAFE_INTEGER;

    return uiSchema.value.pages.length - 1;
});

function emitWizardButton() {
    if (props.layoutElement.buttonType === 'previousWizardPage') {
        currentWizardPage.value = Math.max(currentWizardPage.value - 1, 0);
    } else if (props.layoutElement.buttonType === 'nextWizardPage') {
        const valid =
            wizardValidateFunctions.value[currentWizardPage.value]?.() || false;
        if (!valid) {
            return;
        } else {
            formStateWasValidated.value = false;
        }
        currentWizardPage.value = Math.min(
            currentWizardPage.value + 1,
            maxPages.value
        );
    }
}
</script>

<template>
    <b-button
        :variant="layoutElement.options?.variant"
        :type="buttonType"
        :class="cssClass"
        @click="emitWizardButton"
    >
        <span v-if="!waiting">
            {{ layoutElement.text }}
        </span>
        <span v-else> <b-spinner small /></span>
    </b-button>
</template>

<style scoped></style>
