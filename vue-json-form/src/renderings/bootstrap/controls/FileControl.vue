<script setup lang="ts">
import { BFormFile } from 'bootstrap-vue-next';
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { controlID } from '@/computedProperties/misc';
import { getOption } from '@/utilities';
import { inject, watch, computed, toRefs } from 'vue';
import { languageProviderKey } from '@/components/ProviderKeys.ts';
import { injectJsonData } from '@/computedProperties/json.ts';

const { formData } = storeToRefs(useFormDataStore());

const { jsonElement, layoutElement, savePath } = injectJsonData();
const id = controlID(savePath);

const languageProvider = inject(languageProviderKey);

const multiple = computed(() => {
    return jsonElement.value.type === 'array';
});

const minNumberOfFiles = computed(() => {
    return jsonElement.value.minItems;
});

const maxNumberOfFiles = computed(() => {
    return jsonElement.value.maxItems;
});

watch(
    () => formData.value[savePath],
    (newVal) => {
        validateInput(newVal);
    },
    { deep: true }
);

function validateInput(data: any) {
    const { maxFileSize } = layoutElement.value.options || {};
    const el = document.getElementById(id.value) as HTMLInputElement;

    // Validate number of files
    if (multiple.value) {
        if (
            maxNumberOfFiles.value &&
            (data.length || 0) > maxNumberOfFiles.value
        ) {
            el?.setCustomValidity(
                languageProvider?.getStringTemplate(
                    'errors.fileUpload.tooManyFiles',
                    maxNumberOfFiles.value
                ) || ''
            );
            return;
        } else if (
            minNumberOfFiles.value &&
            (data?.length || 0) < minNumberOfFiles.value
        ) {
            el?.setCustomValidity(
                languageProvider?.getStringTemplate(
                    'errors.fileUpload.tooFewFiles',
                    minNumberOfFiles.value
                ) || ''
            );
            return;
        }
    }
    if (maxFileSize) {
        let dataArray = (Array.isArray(data) ? data : [data]) || [];
        const tooLargeFiles = dataArray.filter(
            (file: File) => file.size > maxFileSize
        );
        if (tooLargeFiles.length > 0) {
            el?.setCustomValidity(
                languageProvider?.getStringTemplate(
                    'errors.fileUpload.fileTooLarge',
                    (maxFileSize / 1024 / 1024).toFixed(2),
                    tooLargeFiles.map((file: File) => file.name).join(', ')
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
        :multiple="multiple"
        :accept="
            getOption<string | undefined>(layoutElement, 'acceptedFileType')
        "
    />
</template>

<style scoped></style>
