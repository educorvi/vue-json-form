<template>
    <form
        @submit="onSubmitFormLocal"
        @reset="resetForm"
        v-if="storedUiSchema && storedJsonSchema"
        class="vjf_form"
    >
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
                :header="error.name"
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
                :header="error.name"
            >
                <p>{{ error.message }}</p>
            </component>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue';
import { onBeforeMount, onMounted, provide, ref, toRaw, watch } from 'vue';
import {
    createPinia,
    getActivePinia,
    setActivePinia,
    storeToRefs,
} from 'pinia';
import { getComponent, useFormStructureStore } from '@/stores/formStructure';
import type { CoreSchemaMetaSchema } from '@educorvi/vue-json-form-schemas';
import type { SubmitOptions, UISchema } from '@educorvi/vue-json-form-schemas';
import FormWrap from '@/components/FormWrap.vue';
import type { RenderInterface } from '@/RenderInterface';
import {
    addFilesToFormdata,
    flattenData,
    useFormDataStore,
} from '@/stores/formData';
import {
    descendantControlOverridesProviderKey,
    requiredProviderKey,
} from '@/components/ProviderKeys';
import RefParser, {
    type ParserOptions,
} from '@apidevtools/json-schema-ref-parser';
import { generateUISchema } from '@/Commons';
import type { GenerationOptions, MapperFunction } from '@/typings/customTypes';

const props = defineProps<{
    /**
     * This function will be called when the form is submitted.
     * @param data The data of the form
     */
    onSubmitForm: (
        data: Record<string, any>,
        customSubmitOptions: SubmitOptions,
        evt: SubmitEvent
    ) => Promise<void>;

    /**
     * The JSON Schema of the form
     */
    jsonSchema: Record<string, any>;

    /**
     * The UI Schema of the form
     */
    uiSchema?: Record<string, any>;

    /**
     * The Render Interface
     * Changes the form's UI components
     */
    renderInterface?: RenderInterface;

    /**
     * Data that should be loaded into the form.
     */
    presetData?: Record<string, any>;

    /**
     * Options for the generation of the UI-Schema if no UI-Schema is provided
     */
    generationOptions?: GenerationOptions;

    /**
     * Return data as key value pairs with the keys being the scopes as used in the ui schema and the values being the data
     */
    returnDataAsScopes?: boolean;

    /**
     * Functions to change JSON- and UI-Schema of fields before rendering
     */
    mapperFunctions?: MapperFunction[];
}>();

setActivePinia(getActivePinia() || createPinia());

provide(descendantControlOverridesProviderKey, {});

const {
    jsonSchema: storedJsonSchema,
    uiSchema: storedUiSchema,
    mappers,
    components,
    defaultData,
    buttonWaiting,
} = storeToRefs(useFormStructureStore());

const { formData, defaultFormData, cleanedFormData } =
    storeToRefs(useFormDataStore());

const validationErrors = ref({
    jsonSchema: {
        validation: [] as Error[],
        parsing: [] as Error[],
    },
    uiSchema: {
        validation: [] as Error[],
        parsing: [] as Error[],
    },
});

let errorViewer: Component;

async function onSubmitFormLocal(evt: SubmitEvent) {
    evt.preventDefault();
    let submitData;
    if (props.returnDataAsScopes) {
        submitData = toRaw(cleanedFormData.value.scopes);
    } else {
        submitData = toRaw(cleanedFormData.value.json);
    }
    submitData = await addFilesToFormdata(submitData);
    const customSubmitOptions =
        JSON.parse(
            decodeURIComponent(
                evt.submitter?.attributes?.getNamedItem('submitOptions')
                    ?.value || 'false'
            )
        ) || {};

    buttonWaiting.value[customSubmitOptions['id']] = true;
    await props.onSubmitForm(submitData, customSubmitOptions, evt);
    buttonWaiting.value[customSubmitOptions['id']] = false;
}

function initDefaultFormData() {
    defaultFormData.value = {
        ...flattenData(props.presetData || {}),
        ...defaultData.value,
    };
}

function cleanFormData() {
    formData.value = {
        ...defaultFormData.value,
    };
}

function resetForm(evt: Event) {
    evt.preventDefault();
    cleanFormData();
}

const parserOptions: ParserOptions = {
    resolve: {
        file: false,
    },
};

async function parseJsonSchema(
    jsonSchema: Record<string, any>
): Promise<CoreSchemaMetaSchema | null> {
    const deRefJSON = await RefParser.dereference(jsonSchema, parserOptions);
    return deRefJSON as CoreSchemaMetaSchema;
}

async function parseUiSchema(
    uiSchema: Record<string, any> | undefined,
    jsonSchema: CoreSchemaMetaSchema
): Promise<UISchema | null> {
    if (uiSchema) {
        const deRefUI = await RefParser.dereference(uiSchema, parserOptions);
        return deRefUI as UISchema;
    } else {
        return generateUISchema(jsonSchema, props.generationOptions);
    }
}

async function assignStoreData(
    obj: {
        jsonSchema: Record<string, any>;
        uiSchema: Record<string, any> | undefined;
        renderInterface: RenderInterface | undefined;
    } & Record<string, any>
) {
    components.value = obj.renderInterface;

    mappers.value = props.mapperFunctions || [];

    errorViewer = getComponent('ErrorViewer');

    const json = await parseJsonSchema(obj.jsonSchema).catch((err) => {
        validationErrors.value.jsonSchema.parsing.push(err);
        console.error(err);
    });
    if (!json) return;
    storedJsonSchema.value = json;

    const ui = await parseUiSchema(obj.uiSchema, json).catch((err) => {
        validationErrors.value.uiSchema.parsing.push(err);
        console.error(err);
    });
    if (!ui) return;
    storedUiSchema.value = ui.layout;
}

provide(requiredProviderKey, true);

onBeforeMount(async () => {
    await assignStoreData({
        jsonSchema: props.jsonSchema,
        uiSchema: props.uiSchema,
        renderInterface: props.renderInterface,
    });
    initDefaultFormData();
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
