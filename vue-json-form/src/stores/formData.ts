import { defineStore, storeToRefs } from 'pinia';
import type { CoreSchemaMetaSchema } from '@/typings/json-schema';
import { useFormStructureStore } from '@/stores/formStructure';
import { cleanScope, isArray } from '@/computedProperties/json';
import type { FunctionArgs } from '@vueuse/core';

function setPropertyByScope(
    object: Record<any, any>,
    key: string,
    value: any
): void {
    if (value === undefined) {
        return;
    }
    // key = key.replace(/\[(\w+)]/g, '/$1'); // convert indexes to properties

    const a = key
        .split('/')
        .filter((x) => x !== '')
        .filter((x, index) => !(index % 2 === 0 && x === 'properties'));

    const arrayIndexRegex = /\[(\w+)]/;

    for (let i = 0; i < a.length; i++) {
        const k = a[i];
        const indexMatch = k.match(arrayIndexRegex);
        if (indexMatch) {
            const index = parseInt(indexMatch[1]);
            const arrayName = k.replace(arrayIndexRegex, '');
            if (!(arrayName in object)) {
                object[arrayName] = [];
            }
            if (i === a.length - 1) {
                object[arrayName][index] = value;
                return;
            }
            if (object[arrayName][index] === undefined) {
                object[arrayName][index] = Object.create(null);
            }
            object = object[arrayName][index];
        } else if (!(k in object)) {
            if (i === a.length - 1) {
                object[a[a.length - 1]] = value;
                return;
            } else {
                object[k] = Object.create(null);
                object = object[k];
            }
        }
    }
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
                newKey = newKey.replace(`.${element}`, `[${index}]`);
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
