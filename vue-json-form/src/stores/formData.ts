import { defineStore, storeToRefs } from 'pinia';
import type { CoreSchemaMetaSchema } from '@/typings/json-schema';
import { useFormStructureStore } from '@/stores/formStructure';

function formatValue(
    value: any,
    currentKey: Readonly<string>,
    data: Readonly<Record<string, any>>,
    arrayValueKeys: string[]
): any {
    if (Array.isArray(value)) {
        return value.map((v) => {
            const subKey = currentKey + '.' + v;
            const newValue = formatValue(
                data[subKey] !== undefined ? data[subKey] : v,
                subKey,
                data,
                arrayValueKeys
            );
            // delete data[subKey];
            arrayValueKeys.push(subKey);
            return newValue;
        });
    } else if (typeof value === 'object') {
        return formatObject(value);
    } else {
        return value;
    }
}

function formatObject(obj: Readonly<Record<string, any>>): Record<string, any> {
    const clone: Record<string, any> = {};
    const arrayValueKeys: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
        clone[key] = formatValue(value, key, obj, arrayValueKeys);
    }
    for (const key of arrayValueKeys) {
        if (key in clone) {
            delete clone[key];
        }
    }
    return clone;
}

export const useFormDataStore = defineStore('formData', {
    state: () => ({
        formData: {} as Record<string, any>,
    }),
    getters: {
        cleanedFormData: (state) => formatObject(state.formData),
    },
});
