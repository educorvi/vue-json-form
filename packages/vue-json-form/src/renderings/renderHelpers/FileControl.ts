import { computed, type ComputedRef, type Ref } from 'vue';
import type {
    Control,
    JSONSchema,
    LayoutElement,
    Options,
} from '@educorvi/vue-json-form-schemas';
import { getOption } from './utilities.ts';

type AcceptedFileType = NonNullable<Options['acceptedFileType']>;

export function getMultiple(
    jsonElement: Readonly<Ref<JSONSchema>>
): ComputedRef<boolean> {
    return computed(() => {
        return jsonElement.value.type === 'array';
    });
}

export function getMinNumberOfFiles(
    jsonElement: Readonly<Ref<JSONSchema>>,
    required: boolean
): ComputedRef<number> {
    return computed(() => {
        return Math.max(jsonElement.value.minItems ?? 0, required ? 1 : 0);
    });
}

export function getMaxNumberOfFiles(
    jsonElement: Readonly<Ref<JSONSchema>>
): ComputedRef<number> {
    return computed(() => {
        return jsonElement.value.maxItems ?? Number.MAX_SAFE_INTEGER;
    });
}

export function getAcceptedFileTypes(
    layoutElement: Readonly<Ref<Control>>
): ComputedRef<AcceptedFileType | undefined> {
    return computed(() => {
        const acceptedFileType = getOption(
            layoutElement.value,
            'acceptedFileType',
            '*'
        );
        if (
            acceptedFileType === '*' ||
            (Array.isArray(acceptedFileType) && acceptedFileType.includes('*'))
        ) {
            return undefined;
        }
        return acceptedFileType;
    });
}

export function getEnrichedLayoutElement(
    layoutElement: Readonly<Ref<Control>>,
    savePath: string
): ComputedRef<Control> {
    return computed(() => {
        return {
            ...layoutElement.value,
            options: {
                ...layoutElement.value.options,
                ...(getOption(
                    layoutElement.value,
                    'descendantControlOverrides'
                )?.[savePath + '/items']?.options || {}),
            },
        };
    });
}
