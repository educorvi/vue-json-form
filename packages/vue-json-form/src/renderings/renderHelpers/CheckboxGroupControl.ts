import { hasEnumValuesForItems } from '@/typings/typeValidators.ts';
import { computed, type Ref } from 'vue';
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { getOption } from '@/renderings/renderHelpers/utilities.ts';

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
