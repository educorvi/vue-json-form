<script setup lang="ts">
import { BFormFile } from 'bootstrap-vue-next';
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { controlID } from '@/computedProperties/misc';
import { getOption } from '@/utilities';
import {
    inject,
    watch,
    computed,
    ref,
    useTemplateRef,
    onMounted,
    onBeforeMount,
} from 'vue';
import {
    inArrayItemProviderKey,
    languageProviderKey,
} from '@/components/ProviderKeys.ts';
import { injectJsonData } from '@/computedProperties/json.ts';
import { validateFileInput } from '@/formControlInputValidation';
import { useFormStructureStore } from '@/stores/formStructure.ts';

const props = defineProps<{
    required?: boolean;
}>();

const { formData } = storeToRefs(useFormDataStore());
const { formStateWasValidated } = storeToRefs(useFormStructureStore());

const {
    jsonElement,
    layoutElement: rawLayoutElement,
    savePath,
} = injectJsonData();
const id = controlID(savePath);

const languageProvider = inject(languageProviderKey);
const inArrayItem = inject(inArrayItemProviderKey);

const layoutElement = computed(() => {
    return {
        ...rawLayoutElement.value,
        options: {
            ...rawLayoutElement.value.options,
            ...(getOption(
                rawLayoutElement.value,
                'descendantControlOverrides'
            )?.[savePath + '/items']?.options || {}),
        },
    };
});

const multiple = computed(() => {
    return jsonElement.value.type === 'array';
});

const minNumberOfFiles = computed(() => {
    return Math.max(jsonElement.value.minItems ?? 0, props.required ? 1 : 0);
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

const validate = () => {
    valid.value = validateFileInput(
        formData.value[savePath],
        layoutElement.value.options?.maxFileSize,
        multiple,
        minNumberOfFiles,
        maxNumberOfFiles,
        languageProvider,
        document.querySelector(`input[name='${savePath}']`) as HTMLInputElement
    );
};
watch(
    [
        () => formData.value[savePath],
        () => jsonElement.value,
        () => layoutElement.value,
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
        ref="fileUpload"
        :class="{ vjf_file: true, noBorderRadius: inArrayItem }"
        :multiple="multiple"
        :accept="getOption(layoutElement, 'acceptedFileType')"
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
