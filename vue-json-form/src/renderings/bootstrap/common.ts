import { hasItems, isTagsConfig } from '@/typings/typeValidators.ts';
import type {
    Control,
    CoreSchemaMetaSchema,
} from '@educorvi/vue-json-form-schemas';
import { computed } from 'vue';

export function isObjectOrArrayViewFunc(
    jsonElement: CoreSchemaMetaSchema,
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
    jsonElement: CoreSchemaMetaSchema,
    layoutElement: Control
) {
    return computed(() => isObjectOrArrayViewFunc(jsonElement, layoutElement));
}
