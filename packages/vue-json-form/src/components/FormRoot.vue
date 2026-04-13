<template>
    <form
        v-if="storedUiSchema && storedJsonSchema"
        :id="id"
        :class="formClass"
        @submit="onSubmitFormLocal"
        @reset="resetForm"
        @invalid.capture="formStateWasValidated = true"
    >
        <FormWrap
            v-if="isLayout(storedUiSchema)"
            :layout-element="storedUiSchema"
        />
        <Wizard
            v-else-if="isWizard(storedUiSchema)"
            :wizard-element="storedUiSchema"
        />
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
        :validation-errors="validationErrors"
    />
</template>

<script setup lang="ts">
import { computed, type ComputedRef, markRaw, type Ref } from 'vue';
import { onBeforeMount, provide, ref, toRaw, watch } from 'vue';
import {
    createPinia,
    getActivePinia,
    setActivePinia,
    storeToRefs,
} from 'pinia';
import {
    type JSONSchema,
    EmptyValidator,
    type SubmitOptions,
    type UISchema,
    type ValidationErrors,
    type Validator,
    type ValidatorClass,
} from '@educorvi/vue-json-form-schemas';
import FormWrap from '@/components/FormWrap.vue';
import type { RenderInterface } from '@/renderings/RenderInterface.ts';
import {
    descendantControlOverridesProviderKey,
    formIdProviderKey,
    languageProviderKey,
    requiredProviderKey,
} from '@/components/ProviderKeys';
import {
    checkUiSchemaVersion,
    generateUISchema,
    generateUUID,
    SUPPORTED_UISCHEMA_VERSION,
} from '@/Commons';
import type { GenerationOptions, MapperClass } from '@/typings/customTypes';
import ParsingAndValidationErrorsView from '@/components/Errors/ParsingAndValidationErrorsView.vue';
import {
    AutoLanguageProvider,
    type LanguageProvider,
} from '@/intl/LanguageProvider.ts';
import { isLayout, isWizard } from '@/typings/typeValidators';
import Wizard from '@/components/LayoutElements/Wizard/Wizard.vue';
import { flattenData } from '@/stores/helpers/flattenData.ts';
import { addFilesToFormdata } from '@/stores/helpers/fileData.ts';
import { getStores } from '@/computedProperties/json.ts';

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
    renderInterface: RenderInterface;

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
    mappers?: MapperClass[];

    /**
     * A boolean variable that determines whether the bootstrap validation state should be hidden.
     */
    hideValidationState?: boolean;

    /**
     * The validator to use for validating the input schemas
     * Defaults to no validation.
     * Validators can be found in the `@educorvi/vue-json-form-schemas` package.
     */
    validator?: ValidatorClass<unknown>;

    /**
     * Provides internationalized string, for example for validation errors
     */
    languageProvider?: LanguageProvider;

    /**
     * Optional stable identifier for this form instance.
     * If not provided, a UUID will be generated.
     */
    formId?: string;
}>();

const id = props.formId ?? generateUUID();
provide(formIdProviderKey, id);

setActivePinia(getActivePinia() || createPinia());

provide(descendantControlOverridesProviderKey, {});
provide(
    languageProviderKey,
    props.languageProvider || new AutoLanguageProvider()
);

const { formStructureStore, formDataStore } = getStores(id);

const {
    jsonSchema: storedJsonSchema,
    uiSchema: storedUiSchema,
    mappers: storeMappers,
    components,
    defaultData,
    buttonWaiting,
    formStateWasValidated,
} = storeToRefs(formStructureStore);

const { formData, defaultFormData, cleanedFormData } =
    storeToRefs(formDataStore);

const validationErrors: Ref<ValidationErrors<unknown>> = ref({
    general: [],
    jsonSchema: {
        validation: [],
        parsing: [],
    },
    uiSchema: {
        validation: [],
        parsing: [],
    },
});

const validator: ComputedRef<Validator<unknown>> = computed(() => {
    if (props.validator) {
        return new props.validator();
    } else {
        return new EmptyValidator();
    }
});

const formClass = computed(() => {
    let baseclass = 'vjf_form';
    if (formStateWasValidated.value && !props.hideValidationState) {
        baseclass += ' was-validated';
    }
    return baseclass;
});

async function onSubmitFormLocal(evt: Event) {
    evt.preventDefault();
    evt.stopPropagation();
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
                submitEvt.submitter?.attributes?.getNamedItem('submit-options')
                    ?.value || 'false'
            )
        ) || {};

    buttonWaiting.value[customSubmitOptions['id']] = true;
    try {
        await props.onSubmitForm(submitData, customSubmitOptions, submitEvt);
    } catch (e: unknown) {
        console.error('Failed to submit form');
        console.error(e);
    } finally {
        buttonWaiting.value[customSubmitOptions['id']] = false;
    }
}

function initDefaultFormData() {
    defaultFormData.value = {
        ...flattenData(props.presetData || {}),
        ...defaultData.value,
    };
}

function setDefaultFormData() {
    formData.value = {
        ...defaultFormData.value,
    };
}

function resetForm(evt: Event) {
    evt.preventDefault();
    setDefaultFormData();
    formStateWasValidated.value = false;
}

async function parseJsonSchema(
    jsonSchema: Record<string, any>
): Promise<JSONSchema | null> {
    if (validator.value.validateJsonSchema(jsonSchema)) {
        return jsonSchema;
    } else {
        validationErrors.value.jsonSchema.validation =
            validator.value.getJsonSchemaValidationErrors();
        return null;
    }
}

async function parseUiSchema(
    uiSchema: Record<string, any> | undefined,
    jsonSchema: JSONSchema
): Promise<UISchema | null> {
    if (uiSchema) {
        if (validator.value.validateUiSchema(uiSchema)) {
            if (!checkUiSchemaVersion(uiSchema)) {
                validationErrors.value.uiSchema.validation = [
                    {
                        title: 'Invalid UI Schema Version',
                        path: '/version',
                        message: `Invalid UI Schema version '${uiSchema.version}' is incompatible with this parser's supported version '${SUPPORTED_UISCHEMA_VERSION}'`,
                    },
                ];
                return null;
            }
            return uiSchema;
        } else {
            validationErrors.value.uiSchema.validation =
                validator.value.getUiSchemaValidationErrors();
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
    components.value = obj.renderInterface
        ? markRaw(obj.renderInterface)
        : undefined;

    storeMappers.value = props.mappers || [];

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
        await validator.value.initialize();
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
    setDefaultFormData();
});

watch(props, async (newVal) => {
    await validator.value.initialize();
    await assignStoreData({
        jsonSchema: newVal.jsonSchema,
        uiSchema: newVal.uiSchema,
        renderInterface: newVal.renderInterface,
    });
});
</script>
