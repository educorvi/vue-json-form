import {
    computed,
    type ComputedRef,
    inject,
    onMounted,
    ref,
    type Ref,
    watch,
} from 'vue';
import type {
    Control,
    JSONSchema,
    Options,
} from '@educorvi/vue-json-form-schemas';
import { getOption } from './utilities.ts';
import { languageProviderKey } from '@/components/ProviderKeys.ts';
import { getStores, injectJsonData } from '@/computedProperties/json.ts';
import { storeToRefs } from 'pinia';
import { validateFileInput } from '@/formControlInputValidation';
import { Base64String } from '@/renderings/renderHelpers/B64File.ts';

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

/**
 * Sets up file input handling and validation for a FileControl. Manages the validation
 * state, file input changes, and updates the form data with encoded file content.
 *
 * @param {boolean} required - Indicates if file input is mandatory.
 * @return {Object} Returns an object containing `file` (a reference to the file(s)) and `state` (a computed validation state).
 */
export function setupFileAndValidation(required: boolean) {
    const { formDataStore, formStructureStore } = getStores();
    const { formData } = storeToRefs(formDataStore);
    const { formStateWasValidated } = storeToRefs(formStructureStore);

    const {
        jsonElement,
        layoutElement: rawLayoutElement,
        savePath,
    } = injectJsonData();
    const languageProvider = inject(languageProviderKey);
    const layoutElement = getEnrichedLayoutElement(rawLayoutElement, savePath);
    const multiple = getMultiple(jsonElement);
    const minNumberOfFiles = getMinNumberOfFiles(jsonElement, required);
    const maxNumberOfFiles = getMaxNumberOfFiles(jsonElement);

    const valid = ref(true);
    const state = computed(() => {
        if (formStateWasValidated.value) {
            return valid.value;
        } else {
            return undefined;
        }
    });

    const file = ref<File | File[] | undefined>();

    const validate = () => {
        valid.value = validateFileInput(
            file.value,
            required,
            layoutElement.value.options?.maxFileSize,
            multiple,
            minNumberOfFiles,
            maxNumberOfFiles,
            languageProvider,
            document.querySelector(`input[name='${savePath}']`)
        );
    };
    watch(
        [
            file,
            () => jsonElement.value,
            () => layoutElement.value,
            () => multiple.value,
            () => minNumberOfFiles.value,
            () => maxNumberOfFiles.value,
            () => required,
        ],
        validate,
        { deep: true }
    );

    watch(file, async (newVal) => {
        if (newVal) {
            if (Array.isArray(newVal)) {
                const b64Strings = await Promise.all(
                    newVal.map((f) => Base64String.fromFile(f))
                );
                formData.value[savePath] = b64Strings.map((b64) =>
                    b64.getBase64Uri()
                );
            } else {
                const b64String = await Base64String.fromFile(newVal);
                formData.value[savePath] = b64String.getBase64Uri();
            }
        } else {
            if (multiple.value) {
                formData.value[savePath] = [];
            } else {
                formData.value[savePath] = undefined;
            }
        }
    });

    watch(
        () => formData.value[savePath],
        async () => {
            if (multiple.value) {
                if (
                    formData.value[savePath] &&
                    Array.isArray(formData.value[savePath])
                ) {
                    const newVal = formData.value[savePath].map(
                        (f: string) => new Base64String(f)
                    );
                    if (!Array.isArray(file.value)) {
                        file.value = newVal.map((v) => v.getFile());
                    }
                    const oldVal = await Promise.all(
                        file.value.map((i) => Base64String.fromFile(i))
                    );
                    if (newVal.find((v, i) => !v.equals(oldVal[i]))) {
                        file.value = newVal.map((v) => v.getFile());
                    }
                }
            } else {
                if (formData.value[savePath]) {
                    const newVal = new Base64String(formData.value[savePath]);
                    if (!(file.value instanceof File)) {
                        file.value = newVal.getFile();
                    }
                    const oldVal = await Base64String.fromFile(file.value);
                    if (!newVal.equals(oldVal)) {
                        file.value = newVal.getFile();
                    }
                }
            }
            validate();
        },
        { immediate: true }
    );

    onMounted(validate);

    return { file, state };
}
