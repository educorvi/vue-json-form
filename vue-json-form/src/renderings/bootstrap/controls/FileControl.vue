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
    const {
        allowMultipleFiles,
        maxNumberOfFiles,
        minNumberOfFiles,
        maxFileSize,
    } = layoutElement.options || {};
    const el = document.getElementById(id.value) as HTMLInputElement;

    // Validate number of files
    if (allowMultipleFiles) {
        if (maxNumberOfFiles && (data.length || 0) > maxNumberOfFiles) {
            el?.setCustomValidity(
                languageProvider?.getStringTemplate(
                    'errors.fileUpload.tooManyFiles',
                    maxNumberOfFiles
                ) || ''
            );
            return;
        } else if (minNumberOfFiles && (data?.length || 0) < minNumberOfFiles) {
            el?.setCustomValidity(
                languageProvider?.getStringTemplate(
                    'errors.fileUpload.tooFewFiles',
                    minNumberOfFiles
                ) || ''
            );
            return;
        }
    }
    if (maxFileSize) {
        let dataArray = (Array.isArray(data) ? data : [data]) || [];
        console.log(dataArray);
        const toLargeFiles = dataArray.filter(
            (file: File) => file.size > maxFileSize
        );
        if (toLargeFiles.length > 0) {
            el?.setCustomValidity(
                languageProvider?.getStringTemplate(
                    'errors.fileUpload.fileTooLarge',
                    (maxFileSize / 1024 / 1024).toFixed(2),
                    toLargeFiles.map((file: File) => file.name).join(', ')
                ) || ''
            );
            return;
        }
    }

    el?.setCustomValidity('');
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
