import { computed, type ComputedRef, inject, type Ref, toRef } from 'vue';
import {
    formStructureProviderKey,
    savePathProviderKey,
} from '@/components/ProviderKeys';
import type { Control } from '@educorvi/vue-json-form-schemas';
import { storeToRefs } from 'pinia';
import { useFormStructureStore } from '@/stores/formStructure';
import type { JSONSchema } from '@educorvi/vue-json-form-schemas';
import jsonPointer from 'json-pointer';
import {
    getFieldName,
    isArrayItemKey,
    sliceScope,
    VJF_ARRAY_ITEM_PREFIX,
} from '@/Commons';
import { isDefined } from '@/typings/typeValidators.ts';

/**
 * Injects JSON data, related UI element, and save path.
 *
 * @return {Object} An object containing the following properties:
 * - `jsonElement` (Ref<JSONSchema>): A reference to the JSON element from the injected form structure.
 * - `layoutElement` (Ref<Control>): A reference to the UI element from the injected form structure.
 * - `savePath` (string): A string representing the save path for the data.
 * @throws {Error} If the required dependencies ('fs' or 'savePath') are not provided or undefined.
 */
export function injectJsonData(): {
    jsonElement: Readonly<Ref<JSONSchema>>;
    layoutElement: Readonly<Ref<Control>>;
    savePath: Readonly<string>;
} {
    const fs = inject(formStructureProviderKey);
    const savePath = inject(savePathProviderKey);
    if (!isDefined(fs) || !isDefined(savePath)) {
        throw new Error('fs and savePath must be provided');
    }
    const jsonElement = toRef(() => fs.value.jsonElement);
    const uiElement = toRef(() => fs.value.uiElement);

    return { jsonElement, layoutElement: uiElement, savePath };
}

/**
 * Safely retrieves the value at the specified JSON Pointer path within a JSON object.
 * If the path does not exist, returns null instead of throwing an error.
 *
 * @param {...Parameters<typeof jsonPointer.get>} args - The arguments to be passed to the `jsonPointer.get` function, including the JSON object and the pointer path.
 * @return {ReturnType<typeof jsonPointer.get>} The value at the specified JSON Pointer path, or null if the path does not exist.
 */
export function getJsonPointerSafe(
    ...args: Parameters<typeof jsonPointer.get>
): ReturnType<typeof jsonPointer.get> {
    if (!jsonPointer.has(...args)) {
        return null;
    }
    return jsonPointer.get(...args);
}

/**
 * Computes the JSON path of the grandparent scope from the provided layout.
 *
 * @param {Ref<Control, Control>} layout - A reactive reference to the Control object containing the scope property.
 * @return {ComputedRef<string>} A computed reference containing the JSON path of the grandparent.
 */
export function getComputedGrandparentJsonPath(
    layout: Ref<Control, Control>
): ComputedRef<string> {
    return computed((): string => {
        return sliceScope(layout.value.scope, -2);
    });
}

/**
 * Determines if a field is required.
 *
 * This function calculates whether a specific field is marked as required by
 * examining the layout's configuration, the grandparent JSON path, and any
 * corresponding `required` property.
 *
 * @param {Ref<Control, Control>} layout - A reference to the layout control.
 * @return {ComputedRef<boolean>} A computed reference that resolves to `true` if the field is determined
 * to be required; otherwise, `false`.
 */
export function getComputedRequired(
    layout: Ref<Control, Control>
): ComputedRef<boolean> {
    const grandParentPath = getComputedGrandparentJsonPath(layout);
    let jsonElement = getComputedJsonElement(
        grandParentPath.value + '/required',
        true
    );

    return computed(() => {
        if (layout.value.options?.forceRequired) {
            return true;
        }

        const fieldName = getFieldName(layout.value.scope);

        // Check if the field is required
        if (
            jsonElement.value !== undefined &&
            Array.isArray(jsonElement.value)
        ) {
            if (jsonElement.value.includes(fieldName)) {
                return true;
            }
        }

        return false;
    });
}

/**
 * Converts a given string with words separated by underscores into title case.
 * Each word is capitalized, and underscores are replaced with spaces.
 *
 * @param {string} string - The input string where words are separated by underscores.
 * @return {string} The converted string in title case with spaces separating words.
 */
function titleCase(string: string): string {
    const sentence = string.toLowerCase().split('_');
    sentence.forEach((part: string, index: number) => {
        if (part) {
            sentence[index] = (part[0]?.toUpperCase() ?? '') + part.slice(1);
        }
    });
    return sentence.join(' ');
}

/**
 * Cleans the given scope string by replacing the array item placeholders
 *
 * @param {string} scope The input scope string to process.
 * @param {string|number} [replaceValue='items'] The value to replace the array item placeholders with.
 * @param {string} [arrayName=''] Limit the replacements to the specified array name.
 * @return {string} The processed scope string with the specified replacements applied.
 */
export function cleanScope(
    scope: string,
    replaceValue: string | number = 'items',
    arrayName: string = ''
): string {
    return scope.replace(
        new RegExp(
            `(?<=${arrayName})\\.${VJF_ARRAY_ITEM_PREFIX}[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}`,
            'g'
        ),
        '/' + replaceValue
    );
}

/**
 * Retrieves a computed JSON element from a JSON schema based on the provided scope.
 *
 * @param {string} scope The scope path used to locate the JSON element within the JSON schema.
 * @param {boolean} [failSilently=false] A flag indicating whether to suppress error messages if the JSON element is not found.
 * @return {ComputedRef<JSONSchema | null>} A computed reference to the JSON schema element if found, otherwise null.
 */
export function getComputedJsonElement(
    scope: string,
    failSilently: boolean = false
): ComputedRef<JSONSchema | null> {
    return computed(() => {
        let internal_scope = scope;
        const { jsonSchema } = storeToRefs(useFormStructureStore());
        if (!jsonSchema.value) return null;
        internal_scope = cleanScope(internal_scope);
        const data = getJsonPointerSafe(
            jsonSchema.value || {},
            internal_scope
        ) as JSONSchema | null;
        if (!data) {
            if (!failSilently) {
                console.error('No json data under scope ' + scope);
            }
            return null;
        }
        return data;
    });
}

/**
 * Checks if the given scope has the type `array` in the JSON schema.
 * @param scope
 */
export function isArray(scope: string) {
    const { jsonSchema } = storeToRefs(useFormStructureStore());
    const cleaned_scope = cleanScope(scope);
    const element = getJsonPointerSafe(
        jsonSchema.value || {},
        cleaned_scope
    ) as JSONSchema;
    return element?.type === 'array';
}

/**
 * Checks if the provided array contains at least one value that is either
 * not a string or not an array item key.
 *
 * @param {any[]} array - The array to check for the presence of a value.
 * @return {boolean} Returns `true` if the array contains a value meeting the condition; otherwise, `false`.
 */
export function arrayContainsValue(array: any[]): boolean {
    return array.reduce((prev, curr) => {
        const isValue = !(typeof curr === 'string' && isArrayItemKey(curr));
        return prev || isValue;
    }, false);
}

/**
 * Computes and returns the label for a given control layout, including optional indicators such as
 * asterisks for required fields.
 *
 * @param {Ref<Control, Control>} layout - A ref object containing the control layout.
 * @return {ComputedRef<string>} A computed reference of the formatted label string.
 */
export function computedLabel(
    layout: Ref<Control, Control>
): ComputedRef<string> {
    const { jsonSchema } = storeToRefs(useFormStructureStore());
    const jsonElement = getComputedJsonElement(layout.value.scope);
    return computed(() => {
        if (!jsonSchema.value) return '';
        return (
            jsonElement.value?.title ||
            titleCase(layout.value.scope.split('/').pop() || '')
        ).concat(getComputedRequired(layout).value ? '*' : '');
    });
}
