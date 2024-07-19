import { defineStore, storeToRefs } from 'pinia';
import type { CoreSchemaMetaSchema } from '@/typings/json-schema';
import { useFormStructureStore } from '@/stores/formStructure';

function formatValue(
    value: any,
    currentKey: Readonly<string>,
    data: Readonly<Record<string, any>>,
    arrayValueKeys: string[],
    formatArrays = true
): any {
    const { arrays } = storeToRefs(useFormStructureStore());
    if (arrays.value.includes(currentKey) && Array.isArray(value)) {
        if (!formatArrays) {
            return value;
        }
        return value.map((v) => {
            const subKey = currentKey + '.' + v;

            const newValue = formatValue(
                data[subKey],
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

function setPropertyByString(
    o: any,
    s: string,
    v: any,
    arrays: Record<string, any> = {}
): void {
    if (v === undefined) {
        return;
    }
    s = s.replace(/\[(\w+)]/g, '.$1'); // convert indexes to properties
    s = s.replace(/^\./, ''); // strip a leading dot

    const a = s
        .split('/')
        .filter((x) => x !== '')
        .filter((x, i) => !(x === 'properties' && i % 2 === 0));

    let arrayBool: boolean | typeof arrays = arrays;

    for (let i = 0, n = a.length; i < n - 1; ++i) {
        console.info(s, a[i], arrayBool);
        const k = a[i];
        if (!(k in o)) {
            if (
                typeof arrayBool === 'object' &&
                typeof arrayBool[k] === 'boolean' &&
                arrayBool[k]
            ) {
                o[k] = [];
            } else {
                o[k] = Object.create(null);
                if (
                    typeof arrayBool === 'object' &&
                    typeof arrayBool[k] === 'object'
                ) {
                    arrayBool = arrayBool[k];
                }
            }
        }
        o = o[k];
    }
    o[a[a.length - 1]] = v;
}

function collectObject(
    data: Readonly<Record<string, any>>
): Record<string, any> {
    const { arrays } = storeToRefs(useFormStructureStore());
    const retObj: Record<string, any> = {};
    const arraysObject: Record<string, any> = {};

    for (const a of arrays.value) {
        setPropertyByString(arraysObject, a, true);
    }

    for (const [key, value] of Object.entries(data)) {
        setPropertyByString(retObj, key, value, arraysObject);
    }

    return retObj;
}

function formatObject(
    obj: Readonly<Record<string, any>>,
    formatArrays = true
): Record<string, any> {
    const clone: Record<string, any> = {};
    const arrayValueKeys: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
        clone[key] = formatValue(value, key, obj, arrayValueKeys, formatArrays);
    }
    for (const key of arrayValueKeys) {
        if (key in clone) {
            delete clone[key];
        }
    }
    return clone;
}

function createCleanFormData(obj: Readonly<Record<string, any>>) {
    let old_result = obj;
    let new_result = {};

    for (let i = 0; i < 10; i++) {
        new_result = formatObject(old_result, false);
        if (JSON.stringify(old_result) === JSON.stringify(new_result)) {
            break;
        }
        old_result = new_result;
    }

    for (let i = 0; i < 10; i++) {
        new_result = formatObject(old_result, true);
        if (JSON.stringify(old_result) === JSON.stringify(new_result)) {
            break;
        }
        old_result = new_result;
    }
    return new_result;
}

export const useFormDataStore = defineStore('formData', {
    state: () => ({
        formData: {} as Record<string, any>,
        defaultFormData: {} as Record<string, any>,
    }),
    getters: {
        cleanedJsonData: (state) => formatObject(collectObject(state.formData)),
    },
});
