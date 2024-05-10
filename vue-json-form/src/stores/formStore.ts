import { defineStore, type StoreDefinition } from 'pinia';
import type {
    CoreSchemaMetaSchema,
    CoreSchemaMetaSchema2,
} from '@/typings/json-schema';
import type { Layout } from '@/typings/ui-schema';
import type { RenderInterface } from '@/RenderInterface';
import type { JsonIfClause } from '@/typings/customTypes';
import { getDefaultData } from '@/stores/formStructureHelpers';
import merge from 'deepmerge';
import {
    convertToJSONSchemaObject,
    formatObject,
} from '@/stores/formDataHelpers';

export type FormStoreState = {
    rawJsonSchema: CoreSchemaMetaSchema | undefined;
    uiSchema: Layout | undefined;
    components: RenderInterface | undefined;
    arrays: string[];
    jsonIfClauses: JsonIfClause[];
    formData: Record<string, any>;
    defaultFormData: Record<string, any>;
};

export type FormStore = StoreDefinition<
    'formStructure',
    FormStoreState,
    {
        defaultData: Record<string, any>;
        cleanedFormData: Record<string, any>;
        cleanedJsonData: Record<string, any>;
        jsonSchema: CoreSchemaMetaSchema | undefined;
    },
    {}
>;

function getFulfilledClauses(state: FormStoreState) {
    return state.jsonIfClauses.map((clause) => {
        const {
            if: ifSchema,
            then: thenSchema,
            else: elseSchema,
            validate,
        } = clause;
        const val = validate(state.formData);
        console.log(val);
        if (val) {
            return thenSchema;
        } else {
            return elseSchema;
        }
    });
}

function getJsonSchema(state: FormStoreState) {
    let schema = state.rawJsonSchema;
    if (!schema) {
        return undefined;
    }
    const clauses = getFulfilledClauses(state);
    for (const clause of clauses) {
        if (clause && typeof clause === 'object') {
            schema = merge(schema, clause);
        }
    }
    return schema;
}

export const useFormStore: FormStore = defineStore('formStructure', {
    state: () =>
        ({
            formData: {},
            defaultFormData: {},

            rawJsonSchema: undefined,
            uiSchema: undefined,
            components: undefined,

            /**
             * List of all arrays in the schema that were written to
             */
            arrays: [],

            jsonIfClauses: [],
        }) as FormStoreState,
    getters: {
        cleanedFormData: (state: FormStoreState) =>
            formatObject(state.formData),
        cleanedJsonData: (state: FormStoreState) =>
            convertToJSONSchemaObject(formatObject(state.formData)),

        defaultData: (state: FormStoreState) => {
            const schema = getJsonSchema(state);
            if (!schema) {
                return {};
            }
            return getDefaultData(schema);
        },
        jsonSchema: getJsonSchema,
    },
});
