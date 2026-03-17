/* eslint-disable @typescript-eslint/no-explicit-any */
import { isArray } from '@/computedProperties/json.ts';
import { isArrayItemKey } from '@/Commons.ts';
import { setPropertyByScope } from '@/stores/helpers/setPropertyByScope.ts';
import { getArrayAliasIndices } from '@/stores/helpers/array.ts';
import type { FormArrays } from '@/stores/formData.ts';

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
 * @param arrays - The arrays in the form
 * @param formId - The form id
 * @returns The cleaned data in scopes formatting and as json object
 */
export function cleanData(
    obj: Readonly<Record<string, any>>,
    arrays: Readonly<FormArrays>,
    formId: string
): CleanedData {
    /**
     * The scopes with their values
     */
    const scopes: Record<string, any> = {};

    const { arrayIndices, arrays: arrayNames } = getArrayAliasIndices(
        obj,
        formId
    );

    // If an array has an array value and does not contain placeholder keys, it can be assigned as is
    for (const arrayKey of arrayNames) {
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
        if (!isArray(key, formId) && value !== undefined) {
            scopes[cleanKey(arrayIndices, key)] = value;
        }
    }

    for (const array of Object.values(arrays)) {
        const data = obj[array.key];
        if (data && Array.isArray(data)) {
            if (
                data.length === 0 &&
                (array.jsonSchema.minItems || 0) > 0 &&
                !array.required
            ) {
                delete scopes[cleanKey(arrayIndices, array.key)];
            }
        }
    }

    const json = reduceToObject(scopes);
    return { scopes, json };
}
