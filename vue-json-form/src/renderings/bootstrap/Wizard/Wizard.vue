<script setup lang="ts">
import { ref } from 'vue';
import WizardPage from '@/renderings/bootstrap/Wizard/WizardPage.vue';
import { BButton } from 'bootstrap-vue-next';
import WizardProgress from '@/renderings/bootstrap/Wizard/WizardProgress.vue';
import type { Wizard as WizardType } from '@educorvi/vue-json-form-schemas';

const props = defineProps<{ wizardElement: WizardType }>();
const currentStep = ref(0);
</script>

<template>
    <WizardProgress
        :max="wizardElement.pages.length"
        :pageNames="wizardElement.options?.pageTitles"
        v-model:currentStep="currentStep"
    />
    <hr />
    <WizardPage
        v-for="(page, index) in wizardElement.pages"
        :page="page"
        :pageName="wizardElement.options?.pageTitles?.[index]"
        v-show="index === currentStep"
    />

    {{ wizardElement }}

    <div class="d-flex justify-content-between">
        <BButton
            variant="primary"
            :disabled="currentStep === 0"
            @click="currentStep -= 1"
            >Previous</BButton
        >
        <BButton
            variant="primary"
            :disabled="currentStep === wizardElement.pages.length - 1"
            @click="currentStep += 1"
            >Next</BButton
        >
    </div>
</template>

<style scoped></style>
