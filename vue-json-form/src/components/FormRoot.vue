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
    <ParsingAndValidationErrorsView
        v-else-if="
            validationErrors.jsonSchema.parsing.length +
                validationErrors.jsonSchema.validation.length +
                validationErrors.uiSchema.parsing.length +
                validationErrors.uiSchema.validation.length +
                validationErrors.general.length >
            0
        "
        :validationErrors="validationErrors"
    />
</template>

<script setup lang="ts">
import type { Component, Ref } from 'vue';
import { onBeforeMount, provide, ref, toRaw, watch } from 'vue';
import {
    createPinia,
    getActivePinia,
    setActivePinia,
    storeToRefs,
} from 'pinia';
import { getComponent, useFormStructureStore } from '@/stores/formStructure';
import {
    AjvValidator,
    type CoreSchemaMetaSchema,
    EmptyValidator,
    type SubmitOptions,
    type UISchema,
    type ValidationErrors,
    Validator,
    type ValidatorClass,
} from '@educorvi/vue-json-form-schemas';
import { type ErrorObject } from 'ajv';
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
import ParsingAndValidationErrorsView from '@/components/Errors/ParsingAndValidationErrorsView.vue';

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

    /**
     * The validator to use for validating the data
     * Defaults to no validation.
     * Validators can be found in the `@educorvi/vue-json-form-schemas` package.
     */
    validator?: ValidatorClass<ErrorObject>;
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

const validationErrors: Ref<ValidationErrors> = ref({
    general: [],
    jsonSchema: {
        validation: [] as ErrorObject[],
        parsing: [] as Error[],
    },
    uiSchema: {
        validation: [] as ErrorObject[],
        parsing: [] as Error[],
    },
});

async function onSubmitFormLocal(evt: Event) {
    evt.preventDefault();
    const submitEvt = evt as SubmitEvent;
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
                submitEvt.submitter?.attributes?.getNamedItem('submitOptions')
                    ?.value || 'false'
            )
        ) || {};

    buttonWaiting.value[customSubmitOptions['id']] = true;
    await props.onSubmitForm(submitData, customSubmitOptions, submitEvt);
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

let validator: Validator<ErrorObject>;
if (props.validator) {
    validator = new props.validator();
} else {
    validator = new EmptyValidator();
}

async function parseJsonSchema(
    jsonSchema: Record<string, any>
): Promise<CoreSchemaMetaSchema | null> {
    if (validator.validateJsonSchema(jsonSchema)) {
        return jsonSchema;
    } else {
        validationErrors.value.jsonSchema.validation =
            validator.getJsonSchemaValidationErrors();
        return null;
    }
}

async function parseUiSchema(
    uiSchema: Record<string, any> | undefined,
    jsonSchema: CoreSchemaMetaSchema
): Promise<UISchema | null> {
    if (uiSchema) {
        if (validator.validateUiSchema(uiSchema)) {
            return uiSchema;
        } else {
            validationErrors.value.uiSchema.validation =
                validator.getUiSchemaValidationErrors();
            return null;
        }
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
    try {
        await validator.initialize();
    } catch (e: any) {
        console.error('Failed to initialize validator');
        console.error(e);
        validationErrors.value.general = [e];
    }
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
