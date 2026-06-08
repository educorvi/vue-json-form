<script setup lang="ts">
import { BFormFile } from 'bootstrap-vue-next';
import { controlID } from '@/computedProperties/misc';
import { FileControl } from '@/renderings/renderHelpers';
import { inject } from 'vue';
import {
    inArrayItemProviderKey,
    languageProviderKey,
} from '@/components/ProviderKeys.ts';
import { injectJsonData } from '@/computedProperties/json.ts';
import { setupFileAndValidation } from '@/renderings/renderHelpers/FileControl.ts';

const props = defineProps<{
    required?: boolean;
    placeholder?: string;
}>();

const {
    jsonElement,
    layoutElement: rawLayoutElement,
    savePath,
} = injectJsonData();
const id = controlID(savePath);

const languageProvider = inject(languageProviderKey);
const inArrayItem = inject(inArrayItemProviderKey);

const layoutElement = FileControl.getEnrichedLayoutElement(
    rawLayoutElement,
    savePath
);

const multiple = FileControl.getMultiple(jsonElement);

const acceptedFileTypes = FileControl.getAcceptedFileTypes(layoutElement);

const { file, state } = setupFileAndValidation(props.required);
</script>

<template>
    <BFormFile
        :id="id"
        v-model="file"
        :state="state"
        :class="{ vjf_file: true, noBorderRadius: inArrayItem }"
        :multiple="multiple"
        :accept="acceptedFileTypes"
        :required="required"
        :browse-text="languageProvider?.getString('controls.upload.browse')"
        :drop-placeholder="
            languageProvider?.getString('controls.upload.dropFilesHere')
        "
        :placeholder="
            props.placeholder ??
            languageProvider?.getString('controls.upload.noFileChosen')
        "
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
