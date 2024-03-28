import { computed, inject, provide } from 'vue';
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

export function injectJsonData() {
    const layoutElement = inject(layoutProviderKey) as Control;
    const jsonElement = inject(jsonElementProviderKey) as CoreSchemaMetaSchema;
    const savePath = inject(savePathProviderKey) as string;

    return { layoutElement, jsonElement, savePath };
}

export function computeParentJsonPath(layout: Control) {
    return computed((): string | null => {
        if (!layout) throw new Error('No layout found');

        let path = pointer.parse(layout.scope);

        if (path.length < 1) return null;

        path = path.slice(0, -1);
        return pointer.compile(path);
    });
}

export function computedGrandparentJsonPath(layout: Control) {
    return computed((): string | null => {
        if (!layout) throw new Error('No layout found');

        let path = pointer.parse(layout.scope);

        if (path.length < 2) return null;

        path = path.slice(0, -2);
        return pointer.compile(path);
    });
}

export function computedRequired(layout: Control) {
    const { jsonSchema } = storeToRefs(useFormStructureStore());
    return computed(() => {
        const parent = computeParentJsonPath(layout);
        if (!parent || !jsonSchema.value || !layout) {
            return false;
        }
        if (pointer.has(jsonSchema.value, parent.value + '/type')) {
            const parentType = pointer.get(jsonSchema.value, parent.value + '/type');
            if (parentType === 'array') return true;
        }

        const gp = computedGrandparentJsonPath(layout);
        if (!gp) {
            return false;
        }
        let required: string;
        try {
            required = pointer.get(jsonSchema.value, gp.value + '/required');
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

export function computedLabel(layout: Control) {
    const { jsonSchema } = storeToRefs(useFormStructureStore());
    return computed(() => {
        if (!jsonSchema.value) return '';
        return (
            pointer.get(jsonSchema.value, layout.scope).title ||
            titleCase(layout?.scope.split('/').pop() || '')
        ).concat(computedRequired(layout).value ? '*' : '');
    });
}
