import { computed, type ComputedRef, type Ref } from 'vue';
import type {
    Control,
    InputOptions,
    JSONSchema,
} from '@educorvi/vue-json-form-schemas';
import type { InputTypeWithoutHidden } from '@/typings/customTypes.ts';

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
