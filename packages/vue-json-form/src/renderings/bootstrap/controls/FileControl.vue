<script setup lang="ts">
import { BFormFile } from 'bootstrap-vue-next';
import { storeToRefs } from 'pinia';
import { controlID } from '@/computedProperties/misc';
import { FileControl, getOption } from '@/renderings/renderHelpers';
import { inject, watch, computed, ref, onMounted, toRef } from 'vue';
import {
    inArrayItemProviderKey,
    languageProviderKey,
} from '@/components/ProviderKeys.ts';
import { getStores, injectJsonData } from '@/computedProperties/json.ts';
import { validateFileInput } from '@/formControlInputValidation';
import { getEnrichedLayoutElement } from '@/renderings/renderHelpers/FileControl.ts';

const props = defineProps<{
    required?: boolean;
}>();

const { formDataStore, formStructureStore } = getStores();

const { formData } = storeToRefs(formDataStore);
const { formStateWasValidated } = storeToRefs(formStructureStore);

const {
    jsonElement,
    layoutElement: rawLayoutElement,
    savePath,
} = injectJsonData();
const id = controlID(savePath);

const languageProvider = inject(languageProviderKey);
const inArrayItem = inject(inArrayItemProviderKey);

const layoutElement = getEnrichedLayoutElement(rawLayoutElement, savePath);

const multiple = FileControl.getMultiple(jsonElement);
const minNumberOfFiles = FileControl.getMinNumberOfFiles(
    jsonElement,
    props.required
);
const maxNumberOfFiles = FileControl.getMaxNumberOfFiles(jsonElement);
const acceptedFileTypes = FileControl.getAcceptedFileTypes(layoutElement);

const valid = ref(true);

const state = computed(() => {
    if (formStateWasValidated.value) {
        return valid.value;
    } else {
        return undefined;
    }
});

const validate = () => {
    valid.value = validateFileInput(
        formData.value[savePath],
        props.required,
        layoutElement.value.options?.maxFileSize,
        multiple,
        minNumberOfFiles,
        maxNumberOfFiles,
        languageProvider,
        document.querySelector(`input[name='${savePath}']`)
    );
};
watch(
    [
        () => formData.value[savePath],
        () => jsonElement.value,
        () => layoutElement.value,
        () => multiple.value,
        () => minNumberOfFiles.value,
        () => maxNumberOfFiles.value,
        () => props.required,
    ],
    validate,
    { deep: true }
);

onMounted(() => {
    if (multiple.value) {
        formData.value[savePath] = formData.value[savePath] || [];
    }
    validate();
});
</script>

<template>
    <BFormFile
        v-model="formData[savePath]"
        :id="id"
        :state="state"
        :class="{ vjf_file: true, noBorderRadius: inArrayItem }"
        :multiple="multiple"
        :accept="acceptedFileTypes"
        :required="required"
    />
</template>

<style scoped lang="scss">
.noBorderRadius {
    & * {
        border-radius: 0;
    }

    & > *,
    & > * > * {
        height: 100%;
    }
}
</style>
