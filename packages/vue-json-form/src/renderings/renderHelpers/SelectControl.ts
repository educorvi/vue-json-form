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
