<template>
    <form @submit="onSubmitFormLocal" @reset="resetForm" v-if="storedUiSchema">
        <FormWrap :layoutElement="storedUiSchema" />
    </form>
</template>

<script setup lang="ts">
import { watch, onMounted, provide } from 'vue';
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
} = storeToRefs(useFormStructureStore());

const { formData } = storeToRefs(useFormDataStore());

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
}>();

function onSubmitFormLocal(evt: Event) {
    if (props.onSubmitForm) {
        evt.preventDefault();
        props.onSubmitForm(formData.value);
    }
}

function resetForm(evt: Event) {
    evt.preventDefault();
    //TODO
    return;
}

function handleParsingError(error: Error) {
    console.error('Error parsing JSON Schema', error);
}

function validateJsonSchema(jsonSchema: Record<string, any>): jsonSchema is CoreSchemaMetaSchema {
    //TODO
    return true;
}

function validateUiSchema(uiSchema: Record<string, any>): uiSchema is UISchema {
    //TODO
    return true;
}

function assignStoreData(
    obj: {
        jsonSchema: Record<string, any>;
        uiSchema: Record<string, any>;
        renderInterface: RenderInterface | undefined;
    } & Record<string, any>
) {
    if (!(validateJsonSchema(obj.jsonSchema) && validateUiSchema(obj.uiSchema))) {
        throw new Error('Invalid JSON Schema or UI Schema');
    }
    storedJsonSchema.value = obj.jsonSchema;
    storedUiSchema.value = obj.uiSchema;
    components.value = obj.renderInterface;
}

provide(requiredProviderKey, true);

onMounted(() => {
    assignStoreData({
        jsonSchema: props.jsonSchema,
        uiSchema: props.uiSchema,
        renderInterface: props.renderInterface,
    });
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
