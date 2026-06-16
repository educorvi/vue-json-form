import { defineStore } from 'pinia';
import { cleanData } from '@/stores/helpers/cleanData.ts';
import { getArrayAliasIndices } from '@/stores/helpers/array.ts';
import type { JSONSchema } from '@educorvi/vue-json-form-schemas';
import type { FormData } from '@/typings/customTypes.ts';

export type ArrayData = {
    key: string;
    jsonSchema: JSONSchema;
    required: boolean;
};

export type FormArrays = Record<string, ArrayData>;

export function createUseFormDataStore(formId: string) {
    return defineStore('data-' + formId, {
        state: () => ({
            formData: {} as FormData,
            defaultFormData: {} as FormData,
            /**
             * List of all arrays in the schema that were written to
             */
            arrays: {} as FormArrays,
        }),
        getters: {
            arrayAliasIndices: (state) =>
                getArrayAliasIndices(state.formData, formId).arrayIndices,
            cleanedFormData: (state) =>
                cleanData(state.formData, state.arrays, formId),
        },
    });
}

type useFormDataStoreType = ReturnType<typeof createUseFormDataStore>;

const storeUseMap = new Map<string, useFormDataStoreType>();
export function useFormDataStore(id: string): ReturnType<useFormDataStoreType> {
    if (!storeUseMap.has(id)) {
        storeUseMap.set(id, createUseFormDataStore(id));
    }
    return (storeUseMap.get(id) as useFormDataStoreType)();
}
