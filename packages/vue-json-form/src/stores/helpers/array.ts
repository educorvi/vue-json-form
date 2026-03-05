import { isArray } from '@/computedProperties/json.ts';
import { isArrayItemKey } from '@/Commons.ts';

/**
 * Get the array alias indices.
 * @param obj - The form data
 */
export function getArrayAliasIndices(obj: Readonly<Record<string, any>>) {
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
    return { arrayIndices, arrays: arrays };
}
