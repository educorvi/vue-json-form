import { computed, type ComputedRef, type Ref, watch } from 'vue';
import type {
    Control,
    JSONSchema,
    TitlesForEnum,
} from '@educorvi/vue-json-form-schemas';
import { hasOption } from '@/typings/typeValidators.ts';

export type SelectOptions = Array<
    { value: string | number; text: string } | string | number
>;

/**
 * Returns a computed ref of the option list for a select / radio control.
 *
 * When the layout element defines `options.enumTitles`, each enum value is
 * mapped to a `{ value, text }` object using the corresponding title.
 * Otherwise the raw enum values from the JSON Schema are returned as-is.
 *
 * @param jsonElement - Readonly ref to the JSON Schema element (must have an
 *   `enum` array for options to be non-empty).
 * @param layoutElement - Readonly ref to the UI schema control element.
 * @returns A computed ref of the resolved option list.
 */
export function getOptions(
    jsonElement: Readonly<Ref<JSONSchema>>,
    layoutElement: Readonly<Ref<Control>>
): ComputedRef<Readonly<SelectOptions>> {
    return computed((): Readonly<SelectOptions> => {
        if (!jsonElement.value.enum) {
            return [] as SelectOptions;
        }
        if (!hasOption(layoutElement.value, 'enumTitles')) {
            return jsonElement.value.enum;
        } else {
            return jsonElement.value.enum.map((value) => {
                if (typeof value !== 'string' && typeof value !== 'number') {
                    return value;
                }
                return {
                    value,
                    text:
                        (
                            layoutElement.value.options
                                ?.enumTitles as TitlesForEnum
                        )[value] || value,
                };
            });
        }
    });
}

/**
 * Sets up a watcher that clears the field's current value whenever the
 * schema's `enum` array changes and the stored value is no longer a valid
 * option.

 * @param jsonElement - Readonly ref to the JSON Schema element.
 * @param formData - Ref to the form's data record.
 * @param savePath - The key in `formData` that holds this field's value.
 */
export function createInvalidValueWatch(
    jsonElement: Readonly<Ref<JSONSchema>>,
    formData: Ref<Record<string, any>>,
    savePath: string
) {
    watch(
        () => jsonElement.value.enum,
        () => {
            if (
                jsonElement.value.enum &&
                !jsonElement.value.enum.includes(formData.value[savePath])
            ) {
                formData.value[savePath] = undefined;
            }
        }
    );
}
