<script setup lang="ts">
import {
    type Validator,
    VueJsonForm as vjfComp,
} from '@educorvi/vue-json-form';
import { computed, type ComputedRef, onBeforeMount, ref } from 'vue';
import { oneOfToEnum } from '@educorvi/vue-json-form';
import type { MapperFunction } from '@educorvi/vue-json-form';
import type { SubmitOptions } from '@educorvi/vue-json-form-schemas';
import axios from 'axios';
import { AjvValidator } from '@educorvi/vue-json-form-ajv-validator';

const props = defineProps<{
    /**
     * The JSON Schema of the form
     */
    jsonSchema: string;

    /**
     * The UI Schema of the form
     */
    uiSchema?: string;

    /**
     * The plain data of the form
     */
    presetData?: string;

    /**
     * Return data as key value pairs with the keys being the scopes as used in the ui schema and the values being the data
     */
    returnDataAsScopes?: boolean | string;

    /**
     * Validate the JSON and UI Schema of the form
     */
    enableSchemaValidation?: boolean | string;
}>();

const validator = ref<typeof AjvValidator | undefined>(undefined);

onBeforeMount(() => {
    if (props.enableSchemaValidation === 'true' || props.enableSchemaValidation === true) {
        validator.value = AjvValidator
    }
})

const emit = defineEmits<{
    (e: 'submit', data: Record<string, any>, options: SubmitOptions): void;
    (e: 'afterSubmitted', data: Record<string, any>, options: SubmitOptions): void;
}>();

const data: ComputedRef = computed(() => {
    return {
        jsonSchema: JSON.parse(props.jsonSchema) as Record<string, any>,
        uiSchema: (props.uiSchema ? JSON.parse(props.uiSchema) : undefined) as
            | Record<string, any>
            | undefined,
        presetData: (props.presetData
            ? JSON.parse(props.presetData)
            : undefined) as Record<string, any> | undefined,
        returnDataAsScopes: (props.returnDataAsScopes
            ? JSON.parse(props.returnDataAsScopes.toString())
            : false) as boolean,
    };
});

const mapperFunctions: MapperFunction[] = [oneOfToEnum];

async function onSubmitForm(data: Record<string, any>, options: SubmitOptions) {
    if (options.action === 'request' && options.request?.url) {
        await axios(options.request.url, {
            method: options.request.method || 'POST',
            headers: options.request.headers,
            data,
        });
    } else {
        emit('submit', data, options);
    }
    emit('afterSubmitted', data, options);
}
</script>

<template>
    <vjf-comp
        :json-schema="data.jsonSchema"
        :ui-schema="data.uiSchema"
        :preset-data="data.presetData"
        :return-data-as-scopes="data.returnDataAsScopes"
        :mapper-functions="mapperFunctions"
        :onSubmitForm="onSubmitForm"
        :validator="validator"
    >
        <slot />
    </vjf-comp>
</template>
