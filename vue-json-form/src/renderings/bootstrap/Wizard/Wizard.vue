<script setup lang="ts">
import { computed, ref } from 'vue';
import WizardPage from '@/renderings/bootstrap/Wizard/WizardPage.vue';
import WizardProgress from '@/renderings/bootstrap/Wizard/WizardProgress.vue';
import type { Wizard as WizardType } from '@educorvi/vue-json-form-schemas';
import { storeToRefs } from 'pinia';
import { useFormStructureStore } from '@/stores/formStructure.ts';

const props = defineProps<{ wizardElement: WizardType }>();
const { currentWizardPage: currentStep } = storeToRefs(useFormStructureStore());
const visible = computed(() => {
    return props.wizardElement.pages.map((_, i) => i === currentStep.value);
});
</script>

<template>
    <WizardProgress
        :max="wizardElement.pages.length"
        :pageNames="wizardElement.options?.pageTitles"
        v-model:currentStep="currentStep"
    />
    <hr />
    <div class="pages-wrapper">
        <div v-for="(page, index) in wizardElement.pages">
            <div v-show="visible[index]">
                <WizardPage
                    :page="page"
                    :pageName="wizardElement.options?.pageTitles?.[index]"
                    :index="index"
                />
            </div>
        </div>
    </div>
</template>

<style scoped>
.pages-wrapper {
    display: flex;
    flex-direction: column;
}
</style>
