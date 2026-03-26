import { computed, type Ref, type SetupContext } from 'vue';
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { hasItems, hasOption } from '@/typings/typeValidators.ts';

/**
 * Returns a computed ref indicating whether the form field wrapper should
 * render prepend or append content.
 *
 * Returns `true` when any of the following are present:
 * - A `prepend` slot
 * - An `append` slot
 * - `options.prepend` on the layout element
 * - `options.append` on the layout element
 *
 * @param slots - The component's slot definitions.
 * @param layoutElement - Readonly ref to the UI schema control element.
 * @returns A computed ref of `true` when prepend or append content exists.
 */
export function getHasPrependOrAppend(
    slots: SetupContext['slots'],
    layoutElement: Readonly<Ref<Control>>
) {
    return computed(() => {
        return !!(
            slots.prepend ||
            slots.append ||
            layoutElement.value.options?.prepend ||
            layoutElement.value.options?.append
        );
    });
}

/**
 * Determines whether the given JSON schema element should be treated as an object or an array view.
 *
 * @param jsonElement - The JSON schema element to evaluate.
 * @param layoutElement - The layout control element associated with the JSON schema.
 * @returns `true` if the JSON schema element should be rendered as an object or array view, `false` otherwise.
 */
function isObjectOrArrayViewFunc(
    jsonElement: JSONSchema,
    layoutElement: Control
): boolean {
    return (
        jsonElement.type === 'object' ||
        (jsonElement.type === 'array' &&
            !(hasItems(jsonElement) && jsonElement.items.enum) &&
            !jsonElement.enum &&
            !(
                hasOption(layoutElement, 'tags') &&
                layoutElement.options.tags?.enabled
            ) &&
            !(
                hasItems(jsonElement) &&
                jsonElement.items.type === 'string' &&
                jsonElement.items.format === 'uri' &&
                layoutElement.options?.displayAsSingleUploadField
            ))
    );
}
/**
 * Returns a computed ref indicating whether the control should be rendered as
 * a nested object/array view rather than as an inline form control.
 *
 * @param jsonElement - Ref to the JSON Schema element.
 * @param layoutElement - Ref to the UI schema control element.
 * @returns A computed ref of `true` when the object/array view should be used.
 */
export function getIsObjectOrArrayViewComputed(
    jsonElement: Ref<JSONSchema, JSONSchema>,
    layoutElement: Ref<Control, Control>
) {
    return computed(() =>
        isObjectOrArrayViewFunc(jsonElement.value, layoutElement.value)
    );
}
