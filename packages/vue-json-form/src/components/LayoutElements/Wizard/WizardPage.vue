<script setup lang="ts">
import type { Layout } from '@educorvi/vue-json-form-schemas';
import FormWrap from '@/components/FormWrap.vue';
import { getRandomId } from '@/computedProperties/misc.ts';
import { useFormStructureStore } from '@/stores/formStructure.ts';
import { onUnmounted } from 'vue';
import { isValidateableElement } from '@/typings/typeValidators.ts';

const props = defineProps<{
    page: Layout;
    pageName?: string;
    index: number;
}>();
const id = getRandomId();

function validate() {
    const validatable = [
        ...(document.getElementById(id)?.querySelectorAll('*') || []),
    ].filter(isValidateableElement);
    const elsWithStates = validatable.map((el) => ({
        valid: el.checkValidity(),
        el,
    }));
    elsWithStates.find((el) => !el.valid)?.el.reportValidity();
    return elsWithStates.every((el) => el.valid);
}

const store = useFormStructureStore();
store.wizardValidateFunctions[props.index] = validate;

onUnmounted(() => {
    delete store.wizardValidateFunctions[props.index];
});
</script>

<template>
    <h2>{{ pageName }}</h2>
    <FormWrap :id="id" :layout-element="page" />
</template>

<style scoped></style>
