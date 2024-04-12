import { defineStore } from 'pinia';

function formatValue(
    value: any,
    currentKey: Readonly<string>,
    data: Readonly<Record<string, any>>,
    arrayValueKeys: string[]
): any {
    if (Array.isArray(value)) {
        return value.map((v) => {
            const subKey = currentKey + '.' + v;
            const newValue = formatValue(data[subKey], subKey, data, arrayValueKeys);
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
        delete clone[key];
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
