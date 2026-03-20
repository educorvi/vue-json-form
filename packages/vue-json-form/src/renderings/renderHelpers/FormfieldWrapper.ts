import { computed, type Ref, type SetupContext } from 'vue';
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { hasItems, hasOption } from '@/typings/typeValidators.ts';

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

function isObjectOrArrayViewFunc(
    jsonElement: JSONSchema,
    layoutElement: Control
) {
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
export function getIsObjectOrArrayViewComputed(
    jsonElement: Ref<JSONSchema, JSONSchema>,
    layoutElement: Ref<Control, Control>
) {
    return computed(() =>
        isObjectOrArrayViewFunc(jsonElement.value, layoutElement.value)
    );
}
