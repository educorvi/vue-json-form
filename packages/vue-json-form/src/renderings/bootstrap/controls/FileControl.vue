<script setup lang="ts">
import { BFormFile } from 'bootstrap-vue-next';
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { controlID } from '@/computedProperties/misc';
import { getOption } from '@/utilities';
import { inject, watch, computed, ref, useTemplateRef } from 'vue';
import { languageProviderKey } from '@/components/ProviderKeys.ts';
import { injectJsonData } from '@/computedProperties/json.ts';
import { validateFileInput } from '@/formControlInputValidation';
import { useFormStructureStore } from '@/stores/formStructure.ts';

const { formData } = storeToRefs(useFormDataStore());
const { formStateWasValidated } = storeToRefs(useFormStructureStore());

const { jsonElement, layoutElement, savePath } = injectJsonData();
const id = controlID(savePath);

const languageProvider = inject(languageProviderKey);

const multiple = computed(() => {
    return jsonElement.value.type === 'array';
});

const minNumberOfFiles = computed(() => {
    return jsonElement.value.minItems ?? 0;
});

const maxNumberOfFiles = computed(() => {
    return jsonElement.value.maxItems ?? Number.MAX_SAFE_INTEGER;
});

const valid = ref(true);

const state = computed(() => {
    if (formStateWasValidated.value) {
        return valid.value;
    } else {
        return undefined;
    }
});

watch(
    () => formData.value[savePath],
    (newVal) => {
        valid.value = validateFileInput(
            newVal,
            layoutElement.value.options?.maxFileSize,
            multiple,
            minNumberOfFiles,
            maxNumberOfFiles,
            languageProvider,
            document.querySelector(
                `input[name='${savePath}']`
            ) as HTMLInputElement
        );
    },
    { deep: true }
);
</script>

<template>
    <BFormFile
        v-model="formData[savePath]"
        :id="id"
        :state="state"
        ref="fileUpload"
        class="vjf_file"
        :multiple="multiple"
        :accept="getOption(layoutElement, 'acceptedFileType')"
    />
</template>

<style scoped></style>
