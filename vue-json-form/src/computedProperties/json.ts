import { computed, type ComputedRef, inject, provide } from 'vue';
import {
    jsonElementProviderKey,
    layoutProviderKey,
    savePathProviderKey,
} from '@/components/ProviderKeys';
import type { Control } from '@/typings/ui-schema';
import pointer from 'json-pointer';
import { storeToRefs } from 'pinia';
import { useFormStructureStore } from '@/stores/formStructure';
import type { CoreSchemaMetaSchema } from '@/typings/json-schema';
import jsonPointer from 'json-pointer';
import { VJF_ARRAY_ITEM_PREFIX } from '@/Commons';

export function injectJsonData() {
    const layoutElement = inject(layoutProviderKey) as Control;
    const jsonElement = inject(jsonElementProviderKey) as CoreSchemaMetaSchema;
    const savePath = inject(savePathProviderKey) as string;

    return { layoutElement, jsonElement, savePath };
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

export function getComputedGrandparentJsonPath(layout: Control) {
    return computed((): string | null => {
        if (!layout) throw new Error('No layout found');

        let path = pointer.parse(layout.scope);

        if (path.length < 2) return null;

        path = path.slice(0, -2);
        return pointer.compile(path);
    });
}

export function getComputedRequired(layout: Control) {
    const { jsonSchema } = storeToRefs(useFormStructureStore());
    const jsonElement = getComputedJsonElement(layout.scope);
    return computed(() => {
        const parent = getComputedParentJsonPath(layout);
        if (!parent || !jsonSchema.value) {
            return false;
        }

        // const parentType = jsonElement.value?.type;
        // if (parentType === 'array' && !jsonElement.value?.enum) return true;

        const gp = getComputedGrandparentJsonPath(layout);
        if (!gp) {
            return false;
        }
        let required: any[];
        try {
            required = jsonElement.value?.required || [];
        } catch (e) {
            console.warn('No required field found in schema for', layout.scope);
            return false;
        }
        if (!required) return false;

        return required.includes(layout?.scope.split('/').pop() || '');
    });
}

function titleCase(string: string) {
    const sentence = string.toLowerCase().split('_');
    for (let i = 0; i < sentence.length; i++) {
        sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
    }

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

export function getComputedJsonElement(scope: string) {
    return computed(() => {
        let internal_scope = scope;
        const { jsonSchema } = storeToRefs(useFormStructureStore());
        internal_scope = internal_scope.replace(
            new RegExp(
                `\\.${VJF_ARRAY_ITEM_PREFIX}[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}`,
                'g'
            ),
            '/items'
        );
        try {
            return jsonPointer.get(
                jsonSchema.value || {},
                internal_scope
            ) as CoreSchemaMetaSchema;
        } catch (e) {
            console.error('invalid json pointer', internal_scope, e);
            return null;
        }
    });
}

export function isArray(scope: string) {
    const { jsonSchema } = storeToRefs(useFormStructureStore());
    const cleaned_scope = cleanScope(scope);
    try {
        const element = jsonPointer.get(
            jsonSchema.value || {},
            cleaned_scope
        ) as CoreSchemaMetaSchema;
        return element?.type === 'array';
    } catch (e) {
        console.error('invalid json pointer', cleaned_scope, e);
        return false;
    }
}

export function computedLabel(layout: Control) {
    const { jsonSchema } = storeToRefs(useFormStructureStore());
    const jsonElement = getComputedJsonElement(layout.scope);
    return computed(() => {
        if (!jsonSchema.value) return '';
        return (
            jsonElement.value?.title ||
            titleCase(layout?.scope.split('/').pop() || '')
        ).concat(getComputedRequired(layout).value ? '*' : '');
    });
}
