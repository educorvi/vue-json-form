import { defineStore } from 'pinia';
import { isArray } from '@/computedProperties/json';

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
    // Do not write anything if the value is undefined
    if (value === undefined) {
        return;
    }

    // Split the key by '/' and filter out empty strings and 'properties'
    // at even indices to get the actual path from the path in the json schema
    const splitKey = key
        .split('/')
        .filter((x) => x !== '')
        .filter((x, index) => !(index % 2 === 0 && x === 'properties'));

    // Regular expression to match array indices
    const arrayIndexRegex = /\[(\w+)]/;

    // Create necessary nested objects or arrays and set the value at the specified path
    for (let i = 0; i < splitKey.length; i++) {
        const k = splitKey[i];
        const indexMatch = k.match(arrayIndexRegex);

        if (indexMatch) {
            // Key is an array index

            // Get name of array and index
            const index = parseInt(indexMatch[1]);
            const arrayName = k.replace(arrayIndexRegex, '');

            // Create array if it doesn't exist
            if (!(arrayName in object)) {
                object[arrayName] = [];
            }

            // If this is the last key, set the value
            if (i === splitKey.length - 1) {
                object[arrayName][index] = value;
                return;
            }

            // If this is not the last key, create a new object
            if (object[arrayName][index] === undefined) {
                object[arrayName][index] = Object.create(null);
            }

            // Move to newly created object
            object = object[arrayName][index];
        } else {
            // Key is an object key

            // Create object if it doesn't exist
            if (!(k in object)) {
                object[k] = Object.create(null);
            }

            // If this is the last key, set the value
            if (i === splitKey.length - 1) {
                object[splitKey[splitKey.length - 1]] = value;
                return;
            } else {
                // Move to newly created object
                object = object[k];
            }
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
 * Cleans the data by mapping the array entry values to their indices
 * @param obj - The object to clean
 * @returns The cleaned data in scopes formatting and as json object
 */
function cleanData(obj: Readonly<Record<string, any>>): {
    scopes: Record<string, any>;
    json: Record<string, any>;
} {
    const scopes: Record<string, any> = {};
    const arrayIndices: Map<string, number> = new Map();
    const arrays = new Set<string>();

    // Create a map of all array values and their indices
    for (const [key, value] of Object.entries(obj)) {
        if (isArray(key)) {
            arrays.add(key);
            if (Array.isArray(value)) {
                value.forEach((element, index) => {
                    arrayIndices.set(element, index);
                });
                scopes[key] = [...value];
            }
        }
    }

    // Replace the placeholder in the scopes with the actual index
    for (const [key, value] of Object.entries(obj)) {
        if (!isArray(key)) {
            let newKey = key;
            for (const [element, index] of arrayIndices.entries()) {
                newKey = newKey.replace(`.${element}`, `[${index}]`);
            }
            scopes[newKey] = value;
        }
    }

    const json = reduceToObject(scopes);
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
