import { defineStore } from 'pinia';
import { cleanData } from '@/stores/helpers/cleanData.ts';
import { getArrayAliasIndices } from '@/stores/helpers/array.ts';

export const useFormDataStore = defineStore('formData', {
    state: () => ({
        formData: {} as Record<string, any>,
        defaultFormData: {} as Record<string, any>,
    }),
    getters: {
        arrayAliasIndices: (state) =>
            getArrayAliasIndices(state.formData).arrayIndices,
        cleanedFormData: (state) => cleanData(state.formData),
    },
});
