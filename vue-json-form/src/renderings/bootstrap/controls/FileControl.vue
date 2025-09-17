<script setup lang="ts">
import { BFormFile } from 'bootstrap-vue-next';
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { getOption } from '@/utilities';
import { inject, watch } from 'vue';
import { languageProviderKey } from '@/components/ProviderKeys.ts';

const { formData } = storeToRefs(useFormDataStore());

const { layoutElement, jsonElement, savePath } = injectJsonData();
const id = controlID(savePath);

const languageProvider = inject(languageProviderKey);

watch(
    () => formData.value[savePath],
    (newVal) => {
        validateInput(newVal);
    },
    { deep: true }
);

function validateInput(data: any) {
    const { allowMultipleFiles, maxNumberOfFiles, minNumberOfFiles } =
        layoutElement.options || {};
    if (allowMultipleFiles) {
        const el = document.getElementById(id.value) as HTMLInputElement;
        if (maxNumberOfFiles && (data.length || 0) > maxNumberOfFiles) {
            el?.setCustomValidity(
                languageProvider?.getStringTemplate(
                    'errors.fileUpload.tooManyFiles',
                    maxNumberOfFiles
                ) || ''
            );
        } else if (minNumberOfFiles && (data?.length || 0) < minNumberOfFiles) {
            el?.setCustomValidity(
                languageProvider?.getStringTemplate(
                    'errors.fileUpload.tooFewFiles',
                    minNumberOfFiles
                ) || ''
            );
        } else {
            el?.setCustomValidity('');
        }
    }
}
</script>

<template>
    <BFormFile
        v-model="formData[savePath]"
        :id="id"
        ref="fileUpload"
        class="vjf_file"
        :multiple="getOption(layoutElement, 'allowMultipleFiles', false)"
        :accept="
            getOption<string | undefined>(layoutElement, 'acceptedFileType')
        "
    />
</template>

<style scoped></style>
