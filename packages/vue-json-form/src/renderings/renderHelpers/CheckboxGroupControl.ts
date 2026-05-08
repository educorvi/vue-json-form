import { hasEnumValuesForItems } from '@/typings/typeValidators.ts';
import { computed, type Ref } from 'vue';
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { getOption } from '@/renderings/renderHelpers/utilities.ts';

/**
 * Returns a computed ref of the option list for a checkbox-group control.
 *
 * Each entry in `jsonElement.items.enum` is mapped to a `{ value, text }`
 * object. When `options.enumTitles` is provided in the layout element, the
 * corresponding title is used as the display text; otherwise the raw enum
 * value is stringified and used directly.
 *
 * Returns an empty array when the schema has no items enum.
 *
 * @param jsonElement - Readonly ref to the JSON Schema element. Must have
 *   `items.enum` for options to be non-empty.
 * @param layoutElement - Readonly ref to the UI schema control element.
 * @returns A computed ref of `{ value, text }` option objects.
 */
export function getOptions(
    jsonElement: Readonly<Ref<JSONSchema>>,
    layoutElement: Readonly<Ref<Control>>
) {
    return computed(() => {
        if (!hasEnumValuesForItems(jsonElement.value)) {
            return [];
        } else {
            return (
                jsonElement.value.items.enum.map((key) => {
                    const textVals: Record<any, any> =
                        getOption(layoutElement.value, 'enumTitles') || {};
                    const text = textVals[key] || key;
                    return { value: key, text: String(text) };
                }) || []
            );
        }
    });
}
