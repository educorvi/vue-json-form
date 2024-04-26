<template>
    <form @submit="onSubmitFormLocal" @reset="resetForm" v-if="storedUiSchema">
        <FormWrap :layoutElement="storedUiSchema" />
        <slot />
    </form>
</template>

<script setup lang="ts">
import { watch, onMounted, provide, shallowRef, toRaw } from 'vue';
import { useFormStructureStore } from '@/stores/formStructure';
import { storeToRefs } from 'pinia';
import type { CoreSchemaMetaSchema } from '@/typings/json-schema';
import type { UISchema } from '@/typings/ui-schema';
import FormWrap from '@/components/FormWrap.vue';
import type { RenderInterface } from '@/RenderInterface';
import { useFormDataStore } from '@/stores/formData';
import { requiredProviderKey } from '@/components/ProviderKeys';

const {
    jsonSchema: storedJsonSchema,
    uiSchema: storedUiSchema,
    components,
    defaultData,
} = storeToRefs(useFormStructureStore());

const { formData, cleanedFormData } = storeToRefs(useFormDataStore());

const props = defineProps<{
    /**
     * This function will be called when the form is submitted. If non is passed, the default submit action will be called.
     * To configure the default submit action, configure the ´options.nativeSubmitOptions´ of the submitting button in the UI-Schema.
     * @param data The data of the form
     */
    onSubmitForm?: (data: Record<string, any>) => void;

    /**
     * The JSON Schema of the form
     */
    jsonSchema: Record<string, any>;

    /**
     * The UI Schema of the form
     */
    uiSchema: Record<string, any>;

    /**
     * The Render Interface
     */
    renderInterface?: RenderInterface;

    /**
     * The default data of the form
     */
    presetData?: Record<string, any>;
}>();

function onSubmitFormLocal(evt: Event) {
    if (props.onSubmitForm) {
        evt.preventDefault();
        props.onSubmitForm(toRaw(cleanedFormData.value));
    }
}

function initFormData(clean = false) {
    formData.value = {
        ...(clean ? {} : formData.value),
        ...(props.presetData || {}),
        ...defaultData.value,
    };
}

function resetForm(evt: Event) {
    evt.preventDefault();
    initFormData(true);
}

function handleParsingError(error: Error) {
    console.error('Error parsing JSON Schema', error);
}

function parseJsonSchema(jsonSchema: Record<string, any>): CoreSchemaMetaSchema {
    //TODO: Validate and dereference
    return jsonSchema as CoreSchemaMetaSchema;
}

function parseUiSchema(uiSchema: Record<string, any>): UISchema {
    //TODO: Validate and dereference
    return uiSchema as UISchema;
}

function assignStoreData(
    obj: {
        jsonSchema: Record<string, any>;
        uiSchema: Record<string, any>;
        renderInterface: RenderInterface | undefined;
    } & Record<string, any>
) {
    storedJsonSchema.value = parseJsonSchema(obj.jsonSchema);
    storedUiSchema.value = parseUiSchema(obj.uiSchema).layout;
    components.value = obj.renderInterface;
}

provide(requiredProviderKey, true);

onMounted(() => {
    assignStoreData({
        jsonSchema: props.jsonSchema,
        uiSchema: props.uiSchema,
        renderInterface: props.renderInterface,
    });
    initFormData();
});

watch(props, (newVal) => {
    assignStoreData({
        jsonSchema: newVal.jsonSchema,
        uiSchema: newVal.uiSchema,
        renderInterface: newVal.renderInterface,
    });
});
</script>

<style scoped></style>
