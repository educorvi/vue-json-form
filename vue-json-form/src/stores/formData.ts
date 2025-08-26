import { defineStore } from 'pinia';
import { isArray } from '@/computedProperties/json';
import { toRaw, isProxy } from 'vue';
import { isArrayItemKey } from '@/Commons';

/**
 * Sets a property on an object based on a scoped key.
 *
 * This function takes an object, a scoped key (which represents a path), and a value.
 * It then sets the value at the specified path within the object, creating nested
 * objects or arrays as necessary.
 *
 * @param object - The object on which the property will be set.
 * @param key - The scoped key representing the path where the value should be set.
 * @param value - The value to set at the specified path.
 **/
function setPropertyByScope(
    object: Record<any, any>,
    key: string,
    value: any
): void {
    const TEMP_INDEX_ESCAPE = '!#index#!';
    const indexRegex = new RegExp(
        `${TEMP_INDEX_ESCAPE}\\w+${TEMP_INDEX_ESCAPE}`
    );

    // Do not write anything if the value is undefined
    if (value === undefined) {
        return;
    }

    // Split the key by '/' and filter out empty strings and 'properties'
    // at even indices to get the actual path from the path in the json schema
    const splitKey = key
        .split('/')
        .filter((x) => x !== '')
        .filter((x, index) => !(index % 2 === 0 && x === 'properties'))
        .join('.')
        .replace(/\[(\w+)]/g, `.${TEMP_INDEX_ESCAPE}$1${TEMP_INDEX_ESCAPE}`)
        .split('.');

    // Create necessary nested objects or arrays and set the value at the specified path
    for (let i = 0; i < splitKey.length; i++) {
        let nextKey: string | number | undefined = splitKey[i];
        if (!nextKey) continue;
        if (indexRegex.test(nextKey)) {
            nextKey = parseInt(nextKey.replace(TEMP_INDEX_ESCAPE, ''));
        }

        if (i === splitKey.length - 1) {
            object[nextKey] = object[nextKey] || value;
        } else {
            if (indexRegex.test(splitKey[i + 1] ?? '')) {
                object[nextKey] = object[nextKey] || [];
            } else {
                object[nextKey] = object[nextKey] || {};
            }
            object = object[nextKey];
        }
    }
}

/**
 * Converts a flat object with scoped keys into a nested object.
 *
 * This function takes an object where keys represent paths (scopes) and values
 * represent the data at those paths. It then constructs a nested object based
 * on these paths.
 *
 * @param obj - A readonly object where keys are scoped paths and values are the data.
 * @returns A nested object constructed from the scoped paths.
 **/
function reduceToObject(
    obj: Readonly<Record<string, any>>
): Record<string, any> {
    const ret = {};

    for (const [key, value] of Object.entries(obj)) {
        setPropertyByScope(ret, key, value);
    }

    return ret;
}

/**
 * The cleaned data of the form
 */
type CleanedData = {
    /**
     * The cleaned data in scopes formatting
     */
    scopes: Record<string, any>;

    /**
     * The cleaned data as object
     */
    json: Record<string, any>;
};

/**
 * Get the array alias indices.
 * @param obj - The form data
 */
function getArrayAliasIndices(
    obj: Readonly<Record<string, any>>
): Map<string, number> {
    const arrayIndices: Map<string, number> = new Map();
    const arrays = new Set<string>();
    for (const [key, value] of Object.entries(obj)) {
        if (isArray(key)) {
            arrays.add(key);
            if (Array.isArray(value)) {
                value.forEach((element, index) => {
                    if (isArrayItemKey(element)) {
                        arrayIndices.set(element, index);
                    }
                });
            }
        }
    }
    return arrayIndices;
}

/**
 * Replaces array-style keys in the specified string with bracket-style indices
 * based on the provided key-index mapping.
 *
 * @param arrayIndices - A map of array item placeholder keys to their respective indices.
 * @param key - The input string where replacements will occur.
 * @return The modified string where all matching keys have been replaced
 *         with their corresponding bracket-style indices.
 */
function cleanKey(arrayIndices: Map<string, number>, key: string): string {
    for (const [element, index] of arrayIndices.entries()) {
        key = key.replace(`.${element}`, `[${index}]`);
    }
    return key;
}

/**
 * Cleans the data by mapping the array entry values to their indices
 * @param obj - The object to clean
 * @returns The cleaned data in scopes formatting and as json object
 */
function cleanData(obj: Readonly<Record<string, any>>): CleanedData {
    /**
     * The scopes with their values
     */
    const scopes: Record<string, any> = {};

    /**
     * Map of array values and their indices in their respective arrays
     */
    const arrayIndices: Map<string, number> = new Map();

    /**
     * List of all arrays in the object
     */
    const arrays = new Set<string>();

    // Create a map of all array aliases and their indices
    for (const [key, value] of Object.entries(obj)) {
        if (isArray(key)) {
            arrays.add(key);
            if (Array.isArray(value)) {
                value.forEach((element, index) => {
                    if (isArrayItemKey(element)) {
                        arrayIndices.set(element, index);
                    }
                });
            }
        }
    }

    // If an array has an array value and does not contain placeholder keys, it can be assigned as is
    for (const arrayKey of arrays) {
        const value = obj[arrayKey];
        if (
            Array.isArray(value) &&
            !value.filter((e: any) => isArrayItemKey(e)).length &&
            value.length > 0
        ) {
            scopes[cleanKey(arrayIndices, arrayKey)] = [...value];
        }
    }

    // Replace the placeholders in the scopes with the actual index
    for (const [key, value] of Object.entries(obj)) {
        if (!isArray(key) && value !== undefined) {
            scopes[cleanKey(arrayIndices, key)] = value;
        }
    }

    const json = reduceToObject(scopes);
    return { scopes, json };
}

export function flattenData(
    data: Record<string, any>,
    into: Record<string, any> = {},
    parentKey = '/properties'
): Record<string, any> {
    for (const [key, value] of Object.entries(data)) {
        const flatKey = `${parentKey}/${key}`;
        if (Array.isArray(value)) {
            into[flatKey] = value;
        } else if (typeof value === 'object' && value !== null) {
            flattenData(value, into, `${flatKey}/properties`);
        } else {
            into[flatKey] = value;
        }
    }
    return into;
}

function readFileDataAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
    });
}

export async function addFilesToFormdata(data: any) {
    if (data instanceof File) {
        return {
            metadata: data,
            data: await readFileDataAsDataUrl(data),
        };
    } else if (isProxy(data)) {
        return await addFilesToFormdata(toRaw(data));
    } else if (typeof data === 'object' || Array.isArray(data)) {
        for (const [key, value] of Object.entries(data)) {
            data[key] = await addFilesToFormdata(value);
        }
    }

    return data;
}

export const useFormDataStore = defineStore('formData', {
    state: () => ({
        formData: {} as Record<string, any>,
        defaultFormData: {} as Record<string, any>,
    }),
    getters: {
        arrayAliasIndices: (state) => getArrayAliasIndices(state.formData),
        cleanedFormData: (state) => cleanData(state.formData),
    },
});
