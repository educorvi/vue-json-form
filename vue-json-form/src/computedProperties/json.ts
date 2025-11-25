import { computed, type ComputedRef, inject, type Ref, toRef } from 'vue';
import {
    formStructureProviderKey,
    savePathProviderKey,
    savePathOverrideProviderKey,
} from '@/components/ProviderKeys';
import type { Control } from '@educorvi/vue-json-form-schemas';
import pointer from 'json-pointer';
import { storeToRefs } from 'pinia';
import { useFormStructureStore } from '@/stores/formStructure';
import type { JSONSchema } from '@educorvi/vue-json-form-schemas';
import jsonPointer from 'json-pointer';
import { isArrayItemKey, VJF_ARRAY_ITEM_PREFIX } from '@/Commons';
import { isDefined } from '@/typings/typeValidators.ts';
import { useFormDataStore } from '@/stores/formData.ts';

export function injectJsonData() {
    const fs = inject(formStructureProviderKey);
    const savePath = inject(savePathProviderKey);
    if (!isDefined(fs) || !isDefined(savePath)) {
        throw new Error('fs and savePath must be provided');
    }
    const jsonElement = toRef(() => fs.value.jsonElement);
    const uiElement = toRef(() => fs.value.uiElement);

    return { jsonElement, layoutElement: uiElement, savePath };
}

function getJsonPointerSafe(
    ...args: Parameters<typeof jsonPointer.get>
): ReturnType<typeof jsonPointer.get> {
    if (!jsonPointer.has(...args)) {
        return null;
    }
    return jsonPointer.get(...args);
}

export function getParentJsonPath(scope: string): string | null {
    let path = pointer.parse(scope);

    if (path.length < 1) return null;

    path = path.slice(0, -1);
    return pointer.compile(path);
}

export function getComputedParentJsonPath(layout: Control) {
    return computed((): string | null => {
        if (!layout) throw new Error('No layout found');

        let path = pointer.parse(layout.scope);

        if (path.length < 1) return null;

        path = path.slice(0, -1);
        return pointer.compile(path);
    });
}

export function getComputedGrandparentJsonPath(layout: Ref<Control, Control>) {
    return computed((): string | null => {
        if (!layout) throw new Error('No layout found');

        let path = pointer.parse(layout.value.scope);

        if (path.length < 2) return null;

        path = path.slice(0, -2);
        return pointer.compile(path);
    });
}

export function getComputedRequired(layout: Ref<Control, Control>) {
    return computed(() => {
        if (layout.value.options?.forceRequired) {
            return true;
        }

        const grandParentPath = getComputedGrandparentJsonPath(layout);
        if (grandParentPath.value === null) {
            return false;
        }

        const fieldName = layout.value.scope.split('/').pop() || '';

        // Check if the field is required
        let jsonElement = getComputedJsonElement(
            grandParentPath.value + '/required',
            true
        );

        if (
            jsonElement.value !== undefined &&
            Array.isArray(jsonElement.value)
        ) {
            if (jsonElement.value.includes(fieldName)) {
                return true;
            }
        }

        // Check if the field is dependentRequired
        jsonElement = getComputedJsonElement(
            grandParentPath.value + '/dependentRequired',
            true
        );

        if (!jsonElement.value || typeof jsonElement !== 'object') return false;

        for (const [dependentOf, dependentChildren] of Object.entries(
            jsonElement.value
        )) {
            if (!Array.isArray(dependentChildren)) {
                continue;
            }
            if (dependentChildren.includes(fieldName)) {
                const savePath =
                    inject(savePathOverrideProviderKey, undefined) ||
                    layout.value.scope;
                const formDataPath =
                    savePath.split('/').slice(0, -1).join('/') +
                    '/' +
                    dependentOf;
                if (useFormDataStore().formData[formDataPath]) {
                    return true;
                }
            }
        }

        return false;
    });
}

function titleCase(string: string) {
    const sentence = string.toLowerCase().split('_');
    sentence.forEach((part: string, index: number) => {
        if (part) {
            sentence[index] = (part[0]?.toUpperCase() ?? '') + part.slice(1);
        }
    });
    return sentence.join(' ');
}

export function cleanScope(
    scope: string,
    replaceValue: string | number = 'items',
    arrayName = ''
) {
    return scope.replace(
        new RegExp(
            `(?<=${arrayName})\\.${VJF_ARRAY_ITEM_PREFIX}[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}`,
            'g'
        ),
        '/' + replaceValue
    );
}

export function getComputedJsonElement(
    scope: string,
    failSilently = false
): ComputedRef<JSONSchema | null> {
    return computed(() => {
        let internal_scope = scope;
        const { jsonSchema } = storeToRefs(useFormStructureStore());
        if (!jsonSchema.value) return null;
        internal_scope = internal_scope.replace(
            new RegExp(
                `\\.${VJF_ARRAY_ITEM_PREFIX}[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}`,
                'g'
            ),
            '/items'
        );
        const data = getJsonPointerSafe(
            jsonSchema.value || {},
            internal_scope
        ) as JSONSchema | null;
        if (!data) {
            if (!failSilently) {
                console.error('No data under scope ' + scope);
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

export function arrayContainsValue(array: any[]): boolean {
    return array.reduce((prev, curr) => {
        const isValue = !(typeof curr === 'string' && isArrayItemKey(curr));
        return prev || isValue;
    }, false);
}

export function computedLabel(layout: Ref<Control, Control>) {
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
