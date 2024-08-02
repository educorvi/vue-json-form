import { defineStore, storeToRefs } from 'pinia';
import type { CoreSchemaMetaSchema } from '@/typings/json-schema';
import { useFormStructureStore } from '@/stores/formStructure';
import { cleanScope, isArray } from '@/computedProperties/json';

function setPropertyByScope(object: any, key: string, value: any): void {
    if (value === undefined) {
        return;
    }
    key = key.replace(/\[(\w+)]/g, '/$1'); // convert indexes to properties

    const a = key
        .split('/')
        .filter((x) => x !== '')
        //TODO bessere Lösung?
        .filter((x) => !(x === 'properties'));

    for (let i = 0; i < a.length - 1; i++) {
        const k = a[i];
        if (!(k in object)) {
            object[k] = Object.create(null);
        }
        object = object[k];
    }
    object[a[a.length - 1]] = value;
}

function reduceObjects(
    obj: Readonly<Record<string, any>>
): Record<string, any> {
    const ret = {};

    for (const [key, value] of Object.entries(obj)) {
        setPropertyByScope(ret, key, value);
    }

    return ret;
}

function cleanData(obj: Readonly<Record<string, any>>): Record<string, any> {
    const scopes: Record<string, any> = {};
    const arrayIndices: Map<string, number> = new Map();
    const arrays = new Set<string>();
    for (const [key, value] of Object.entries(obj)) {
        if (isArray(key)) {
            arrays.add(key);
            if (Array.isArray(value)) {
                value.forEach((element, index) => {
                    arrayIndices.set(element, index);
                });
            }
        }
    }
    for (const [key, value] of Object.entries(obj)) {
        if (!isArray(key)) {
            let newKey = key;
            for (const [element, index] of arrayIndices.entries()) {
                newKey = newKey.replace(`.${element}`, `/${index}`);
            }
            scopes[newKey] = value;
        }
    }

    const json = reduceObjects(scopes);
    return { scopes, json };
}

export const useFormDataStore = defineStore('formData', {
    state: () => ({
        formData: {} as Record<string, any>,
        defaultFormData: {} as Record<string, any>,
    }),
    getters: {
        cleanedFormData: (state) => cleanData(state.formData),
    },
});
