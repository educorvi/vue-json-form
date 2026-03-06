import { defineStore } from 'pinia';
import { cleanData } from '@/stores/helpers/cleanData.ts';
import { getArrayAliasIndices } from '@/stores/helpers/array.ts';
import type { JSONSchema } from '@educorvi/vue-json-form-schemas';

export type ArrayData = {
    key: string;
    jsonSchema: JSONSchema;
    required: boolean;
};

export type FormArrays = Record<string, ArrayData>;

export const useFormDataStore = defineStore('formData', {
    state: () => ({
        formData: {} as Record<string, any>,
        defaultFormData: {} as Record<string, any>,
        /**
         * List of all arrays in the schema that were written to
         */
        arrays: {} as FormArrays,
    }),
    getters: {
        arrayAliasIndices: (state) =>
            getArrayAliasIndices(state.formData).arrayIndices,
        cleanedFormData: (state) => cleanData(state.formData, state.arrays),
    },
});
