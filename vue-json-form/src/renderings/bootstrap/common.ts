import { hasItems, isTagsConfig } from '@/typings/typeValidators.ts';
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { computed, type Ref } from 'vue';

export function isObjectOrArrayViewFunc(
    jsonElement: JSONSchema,
    layoutElement: Control
) {
    return (
        jsonElement.type === 'object' ||
        (jsonElement.type === 'array' &&
            !(hasItems(jsonElement) && jsonElement.items.enum) &&
            !jsonElement.enum &&
            !(
                isTagsConfig(layoutElement.options) &&
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
