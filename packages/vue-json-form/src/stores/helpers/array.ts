import { isArray } from '@/computedProperties/json.ts';
import { isArrayItemKey } from '@/Commons.ts';
import type { FormData } from '@/typings/customTypes.ts';

/**
 * Get the array alias indices.
 * @param obj - The form data
 * @param formId - The form id
 */
export function getArrayAliasIndices(obj: Readonly<FormData>, formId: string) {
    const arrayIndices: Map<string, number> = new Map();
    const arrays = new Set<string>();
    for (const [key, value] of Object.entries(obj)) {
        if (isArray(key, formId)) {
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
    return { arrayIndices, arrays: arrays };
}
