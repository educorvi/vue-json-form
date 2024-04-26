<template>
    <form @submit="onSubmitFormLocal" @reset="resetForm" v-if="storedUiSchema && storedJsonSchema">
        <FormWrap :layoutElement="storedUiSchema" />
        <slot />
    </form>
    <div
        v-else-if="
            validationErrors.jsonSchema.parsing.length +
                validationErrors.jsonSchema.validation.length +
                validationErrors.uiSchema.parsing.length +
                validationErrors.uiSchema.validation.length >
            0
        "
    >
        <h4>Error</h4>
        <p>There were errors while rendering this form</p>
        <h5>JSON Schema</h5>
        <div v-if="validationErrors.jsonSchema.parsing.length > 0">
            <h6>Parsing errors</h6>
            <component
                :is="errorViewer"
                v-for="error in validationErrors.jsonSchema.parsing"
                :key="error.message"
                :header="error.name"
            >
                <p>{{ error.message }}</p>
            </component>
        </div>
        <div v-if="validationErrors.jsonSchema.validation.length > 0">
            <h6>Validation errors</h6>
            <component
                :is="errorViewer"
                v-for="error in validationErrors.jsonSchema.validation"
                :key="error.message"
                :header="error.keyword"
            >
                <p>{{ error.message }}</p>
            </component>
        </div>

        <h5 class="mt-4">UI Schema</h5>
        <div v-if="validationErrors.uiSchema.parsing.length > 0">
            <h6>Parsing errors</h6>
            <component
                :is="errorViewer"
                v-for="error in validationErrors.uiSchema.parsing"
                :key="error.message"
                :header="error.name"
            >
                <p>{{ error.message }}</p>
            </component>
        </div>
        <div v-if="validationErrors.uiSchema.validation.length > 0">
            <h6>Validation errors</h6>
            <component
                :is="errorViewer"
                v-for="error in validationErrors.uiSchema.validation"
                :key="error.message"
                :header="error.keyword"
            >
                <p>{{ error.message }}</p>
            </component>
        </div>
    </div>
</template>

<script setup lang="ts">
import { watch, onMounted, provide, shallowRef, toRaw, ref } from 'vue';
import type { Component } from 'vue';
import { getComponent, useFormStructureStore } from '@/stores/formStructure';
import { storeToRefs } from 'pinia';
import type { CoreSchemaMetaSchema } from '@/typings/json-schema';
import type { UISchema } from '@/typings/ui-schema';
import FormWrap from '@/components/FormWrap.vue';
import type { RenderInterface } from '@/RenderInterface';
import { useFormDataStore } from '@/stores/formData';
import { requiredProviderKey } from '@/components/ProviderKeys';
import RefParser, { type ParserOptions } from '@apidevtools/json-schema-ref-parser';
import metaJSONSchema from '@/schemas/json-schema_draft7.json';
import metaUISchema from '@/schemas/ui/_compiled.schema.json';
import Ajv, { type ErrorObject, type JSONSchemaType } from 'ajv';
import { allSchemas, allSchemasWithIncludedRita } from '@/schemas/ui';

const ajv = new Ajv({
    formats: { 'json-pointer': true },
});

const {
    jsonSchema: storedJsonSchema,
    uiSchema: storedUiSchema,
    components,
    defaultData,
} = storeToRefs(useFormStructureStore());

const { formData, cleanedFormData } = storeToRefs(useFormDataStore());

const validationErrors = ref({
    jsonSchema: {
        validation: [] as ErrorObject[],
        parsing: [] as Error[],
    },
    uiSchema: {
        validation: [] as ErrorObject[],
        parsing: [] as Error[],
    },
});

let errorViewer: Component;

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

const parserOptions: ParserOptions = {
    resolve: {
        // http: true,
        // file: false,
        external: false,
    },
    dereference: {
        onDereference: (path, value) => console.log(path, value),
    },
};

async function parseJsonSchema(
    jsonSchema: Record<string, any>
): Promise<CoreSchemaMetaSchema | null> {
    const deRefJSON = await RefParser.dereference(jsonSchema, parserOptions);
    const valid = ajv.validateSchema(deRefJSON);
    if (!valid) {
        validationErrors.value.jsonSchema.validation = ajv.errors || [];
        return null;
    }
    return deRefJSON as CoreSchemaMetaSchema;
}

function isUISchema(ui: Record<string, any>): ui is UISchema {
    const validate = ajv.compile(metaUISchema);
    if (!validate(ui)) {
        validationErrors.value.uiSchema.validation = validate.errors || [];
        return false;
    } else {
        return true;
    }
}

async function parseUiSchema(uiSchema: Record<string, any>): Promise<UISchema | null> {
    console.log(uiSchema);
    const deRefUI = await RefParser.dereference(uiSchema, parserOptions);
    if (!isUISchema(deRefUI)) {
        return null;
    }
    return deRefUI as UISchema;
}

function assignStoreData(
    obj: {
        jsonSchema: Record<string, any>;
        uiSchema: Record<string, any>;
        renderInterface: RenderInterface | undefined;
    } & Record<string, any>
) {
    components.value = obj.renderInterface;

    errorViewer = getComponent('ErrorViewer');

    parseJsonSchema(obj.jsonSchema)
        .then((res) => {
            if (!res) return;
            storedJsonSchema.value = res;
        })
        // .catch(validationErrors.value.jsonSchema.parsing.push);
        .catch((err) => {
            validationErrors.value.jsonSchema.parsing.push(err);
            console.error(err);
        });

    parseUiSchema(obj.uiSchema)
        .then((res) => {
            if (!res) return;
            storedUiSchema.value = res.layout;
        })
        // .catch(validationErrors.value.uiSchema.parsing.push);
        .catch((err) => {
            validationErrors.value.uiSchema.parsing.push(err);
            console.error(err);
        });
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
