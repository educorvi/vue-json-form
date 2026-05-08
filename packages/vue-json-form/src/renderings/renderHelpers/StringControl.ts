import { computed, type ComputedRef, type Ref } from 'vue';
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import type { InputTypeWithoutHidden } from '@/typings/customTypes.ts';
import { isInputTypeWithoutHidden } from '@/typings/typeValidators.ts';

/**
 * Returns a computed ref of the HTML `type` attribute for a string input.
 *
 * The type is derived (in priority order) from:
 * 1. `layoutElement.options.format` – an explicit format override in the UI schema.
 * 2. `jsonElement.format` – the JSON Schema `format` keyword, with
 *    `date-time` normalised to the HTML-compatible value `datetime-local`.
 *
 * Returns `undefined` when the resolved value is not a valid HTML input type,
 * which results in the browser defaulting to `text`.
 *
 * @param jsonElement - Readonly ref to the JSON Schema element.
 * @param layoutElement - Readonly ref to the UI schema control element.
 * @returns A computed ref of the HTML input type, or `undefined`.
 */
export function getType(
    jsonElement: Readonly<Ref<JSONSchema>>,
    layoutElement: Readonly<Ref<Control>>
): ComputedRef<InputTypeWithoutHidden | undefined> {
    return computed(() => {
        const str =
            layoutElement.value.options?.format ||
            jsonElement.value.format?.replace('date-time', 'datetime-local');
        if (!isInputTypeWithoutHidden(str)) {
            return undefined;
        }
        return str;
    });
}

/**
 * Returns a computed ref indicating whether the string control should be
 * rendered as a `<textarea>` instead of a single-line `<input>`.
 *
 * Multiline rendering is enabled when `options.multi` is `true` (boolean) or
 * any number greater than 1.
 *
 * @param layoutElement - Readonly ref to the UI schema control element.
 * @returns A computed ref of `true` when the control is multiline.
 */
export function getIsMultiLine(layoutElement: Readonly<Ref<Control>>) {
    return computed(() => {
        const multi = layoutElement.value.options?.multi;
        if (typeof multi !== 'number') {
            return !!multi;
        } else {
            return multi > 1;
        }
    });
}

/**
 * Returns a computed ref of the explicit row count for a multiline textarea.
 *
 * Only returns a value when `options.multi` is set to a number; a boolean
 * `multi` value yields `undefined` so the textarea falls back to its default
 * height.
 *
 * @param layoutElement - Readonly ref to the UI schema control element.
 * @returns A computed ref of the row count, or `undefined`.
 */
export function getNumberOfLines(layoutElement: Readonly<Ref<Control>>) {
    return computed(() => {
        const multi = layoutElement.value.options?.multi;
        if (typeof multi !== 'number') {
            return undefined;
        } else {
            return multi;
        }
    });
}
