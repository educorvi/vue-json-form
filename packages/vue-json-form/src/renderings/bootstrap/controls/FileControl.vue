<script setup lang="ts">
import { BFormFile } from 'bootstrap-vue-next';
import { storeToRefs } from 'pinia';
import { controlID } from '@/computedProperties/misc';
import { Base64String, FileControl } from '@/renderings/renderHelpers';
import { inject, watch, computed, ref, onMounted } from 'vue';
import {
    inArrayItemProviderKey,
    languageProviderKey,
} from '@/components/ProviderKeys.ts';
import { getStores, injectJsonData } from '@/computedProperties/json.ts';
import { validateFileInput } from '@/formControlInputValidation';

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

const layoutElement = FileControl.getEnrichedLayoutElement(
    rawLayoutElement,
    savePath
);

const multiple = FileControl.getMultiple(jsonElement);
const minNumberOfFiles = FileControl.getMinNumberOfFiles(
    jsonElement,
    props.required
);
const maxNumberOfFiles = FileControl.getMaxNumberOfFiles(jsonElement);
const acceptedFileTypes = FileControl.getAcceptedFileTypes(layoutElement);

const valid = ref(true);
const file = ref<File | File[] | undefined>();

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

watch(file, async (newVal) => {
    if (newVal) {
        if (Array.isArray(newVal)) {
            const b64Strings = await Promise.all(
                newVal.map((f) => Base64String.fromFile(f))
            );
            formData.value[savePath] = b64Strings.map((b64) =>
                b64.getBase64Uri()
            );
        } else {
            const b64String = await Base64String.fromFile(newVal);
            formData.value[savePath] = b64String.getBase64Uri();
        }
    }
});

watch(
    () => formData.value[savePath],
    () => {
        if (multiple.value) {
            if (
                formData.value[savePath] &&
                Array.isArray(formData.value[savePath])
            ) {
                const newVal = formData.value[savePath].map((f: string) =>
                    new Base64String(f).getFile()
                );
                if (JSON.stringify(newVal) !== JSON.stringify(file.value)) {
                    file.value = newVal;
                }
            }
        } else {
            if (formData.value[savePath]) {
                const newVal = new Base64String(
                    formData.value[savePath]
                ).getFile();
                if (JSON.stringify(newVal) !== JSON.stringify(file.value)) {
                    file.value = newVal;
                }
            }
        }
        validate();
    },
    { immediate: true }
);

onMounted(validate);
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
