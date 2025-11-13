<script setup lang="ts">
import { ref } from 'vue';
import WizardPage from '@/renderings/bootstrap/Wizard/WizardPage.vue';
import { BButton } from 'bootstrap-vue-next';
import WizardProgress from '@/renderings/bootstrap/Wizard/WizardProgress.vue';

const pages = ref<string[]>(['page 1', 'page 2', 'page 3', 'page 4']);
const pageNames = ref(['Page 1', 'Page 2Page 2', 'Page 3', 'Page 4']);
const currentStep = ref(0);
</script>

<template>
    <WizardProgress
        :max="pages.length"
        :pageNames="pageNames"
        v-model:currentStep="currentStep"
    />
    <hr />
    <WizardPage
        v-for="(page, index) in pages"
        :page="page"
        :pageName="pageNames[index]"
        v-show="index === currentStep"
    />

    <div class="d-flex justify-content-between">
        <BButton
            variant="primary"
            :disabled="currentStep === 0"
            @click="currentStep -= 1"
            >Previous</BButton
        >
        <BButton
            variant="primary"
            :disabled="currentStep === pages.length - 1"
            @click="currentStep += 1"
            >Next</BButton
        >
    </div>
</template>

<style scoped></style>
