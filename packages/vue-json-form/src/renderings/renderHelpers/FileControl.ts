import { computed, type ComputedRef, type Ref } from 'vue';
import type {
    Control,
    JSONSchema,
    Options,
} from '@educorvi/vue-json-form-schemas';
import { getOption } from './utilities.ts';

type AcceptedFileType = NonNullable<Options['acceptedFileType']>;

/**
 * Returns a computed ref indicating whether the file input accepts multiple
 * files. Multiple-file mode is enabled when the JSON Schema type is `array`.
 *
 * @param jsonElement - Readonly ref to the JSON Schema element.
 * @returns A computed ref of `true` when multiple files are allowed.
 */
export function getMultiple(
    jsonElement: Readonly<Ref<JSONSchema>>
): ComputedRef<boolean> {
    return computed(() => {
        return jsonElement.value.type === 'array';
    });
}

/**
 * Returns a computed ref of the minimum number of files that must be
 * selected. The effective minimum is the greater of `jsonElement.minItems`
 * and `1` (when the field is required), defaulting to `0` when neither is
 * set.
 *
 * @param jsonElement - Readonly ref to the JSON Schema element.
 * @param required - Whether the field is required by the parent schema.
 * @returns A computed ref of the minimum file count.
 */
export function getMinNumberOfFiles(
    jsonElement: Readonly<Ref<JSONSchema>>,
    required: boolean
): ComputedRef<number> {
    return computed(() => {
        return Math.max(jsonElement.value.minItems ?? 0, required ? 1 : 0);
    });
}

/**
 * Returns a computed ref of the maximum number of files that may be selected.
 * Defaults to `Number.MAX_SAFE_INTEGER` when `jsonElement.maxItems` is not
 * set, effectively allowing an unlimited number of files.
 *
 * @param jsonElement - Readonly ref to the JSON Schema element.
 * @returns A computed ref of the maximum file count.
 */
export function getMaxNumberOfFiles(
    jsonElement: Readonly<Ref<JSONSchema>>
): ComputedRef<number> {
    return computed(() => {
        return jsonElement.value.maxItems ?? Number.MAX_SAFE_INTEGER;
    });
}

/**
 * Returns a computed ref of the accepted file type constraint for a file
 * input, derived from `options.acceptedFileType`.
 *
 * Returns `undefined` when the option is absent, set to `'*'`, or contains
 * `'*'` in an array, so that the `accept` attribute is omitted and all file
 * types are permitted.
 *
 * @param layoutElement - Readonly ref to the UI schema control element.
 * @returns A computed ref of the accepted file type constraint, or `undefined`
 *   when all types should be accepted.
 */
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

/**
 * Returns a computed ref of the layout element enriched with any
 * descendant control overrides that apply to the array's items.
 *
 * When `options.descendantControlOverrides` contains an entry for
 * `<savePath>/items`, its `options` are merged (shallowly) into the base
 * layout element's options. This allows parent array controls to customize
 * the rendering of their item controls without modifying the schema.
 *
 * @param layoutElement - Readonly ref to the UI schema control element.
 * @param savePath - The JSON Pointer path used to look up the items override.
 * @returns A computed ref of the enriched layout element.
 */
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
