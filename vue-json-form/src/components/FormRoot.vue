<template>
    <form
        @submit="onSubmitFormLocal"
        @reset="resetForm"
        v-if="storedUiSchema && storedJsonSchema"
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
import { getComponent, useFormStructureStore } from '@/stores/formStructure';
import { storeToRefs } from 'pinia';
import type { CoreSchemaMetaSchema } from '@/typings/json-schema';
import type { UISchema } from '@/typings/ui-schema';
import FormWrap from '@/components/FormWrap.vue';
import type { RenderInterface } from '@/RenderInterface';
import { useFormDataStore } from '@/stores/formData';
import { requiredProviderKey } from '@/components/ProviderKeys';
import RefParser, {
    type ParserOptions,
} from '@apidevtools/json-schema-ref-parser';
import { generateUISchema } from '@/Commons';
import type { GenerationOptions } from '@/typings/customTypes';

const {
    jsonSchema: storedJsonSchema,
    uiSchema: storedUiSchema,
    components,
    defaultData,
} = storeToRefs(useFormStructureStore());

const { formData, defaultFormData, cleanedFormData, cleanedJsonData } =
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
    uiSchema?: Record<string, any>;

    /**
     * The Render Interface
     */
    renderInterface?: RenderInterface;

    /**
     * The default data of the form
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
}>();

function onSubmitFormLocal(evt: Event) {
    if (props.onSubmitForm) {
        evt.preventDefault();
        if (props.returnDataAsScopes) {
            props.onSubmitForm(toRaw(cleanedFormData.value));
        } else {
            props.onSubmitForm(toRaw(cleanedJsonData.value));
        }
    }
}

function initDefaultFormData() {
    defaultFormData.value = {
        ...(props.presetData || {}),
        ...defaultData.value,
    };
}

function cleanFormData() {
    formData.value = defaultFormData.value;
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
