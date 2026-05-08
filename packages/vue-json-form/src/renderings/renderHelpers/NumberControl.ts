import { computed, type Ref } from 'vue';
import type { JSONSchema } from '@educorvi/vue-json-form-schemas';

/**
 * Returns a computed ref of the `step` attribute value for a numeric input.
 *
 * Resolution order:
 * - Uses `jsonElement.multipleOf` when set.
 * - Falls back to `1` for `integer` schemas (no fractional input).
 * - Falls back to an extremely small value (`1e-22`) for `number` schemas so
 *   that the browser accepts any decimal input.
 *
 * @param jsonElement - Readonly ref to the JSON Schema element.
 * @returns A computed ref of the step value.
 */
export function getStep(jsonElement: Readonly<Ref<JSONSchema>>) {
    return computed(() => {
        if (jsonElement.value.type === 'integer') {
            return jsonElement.value.multipleOf || 1;
        }
        return jsonElement.value.multipleOf || 0.0000000000000000000001;
    });
}
