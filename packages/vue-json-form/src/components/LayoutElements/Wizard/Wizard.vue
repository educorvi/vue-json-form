<script setup lang="ts">
import { computed, ref } from 'vue';
import WizardPage from '@/components/LayoutElements/Wizard/WizardPage.vue';
import { storeToRefs } from 'pinia';
import { useFormStructureStore } from '@/stores/formStructure.ts';
import type { Wizard as WizardType } from '@educorvi/vue-json-form-schemas';
import { getStores } from '@/computedProperties/json';

const { formStructureStore } = getStores();

const WizardProgress = formStructureStore.getComponent('WizardProgress');

const props = defineProps<{ wizardElement: WizardType }>();
const { currentWizardPage: currentStep } = storeToRefs(formStructureStore);
const visible = computed(() => {
    return props.wizardElement.pages.map((_, i) => i === currentStep.value);
});
</script>

<template>
    <WizardProgress
        :numberOfPages="wizardElement.pages.length"
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
