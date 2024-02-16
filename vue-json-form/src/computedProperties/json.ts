import { computed, inject, provide } from 'vue';
import { jsonElementProviderKey, layoutProviderKey } from '@/components/ProviderKeys';
import type { Control } from '@/typings/ui-schema';
import pointer from 'json-pointer';
import { storeToRefs } from 'pinia';
import { useFormStructureStore } from '@/stores/formStructure';

export function injectJsonData() {
    const layoutElement = inject(layoutProviderKey) as Control;
    const jsonElement = inject(jsonElementProviderKey) as Control;

    return { layoutElement, jsonElement };
}

export function computedGrandparentJsonPath(layout: Control) {
    return computed((): string | null => {
        if (!layout) throw new Error('No layout found');

        let path = pointer.parse(layout.scope);

        if (path.length === 0) return null;

        path = path.slice(0, -2);
        return pointer.compile(path);
    });
}

export function computedRequired(layout: Control) {
    const { jsonSchema } = storeToRefs(useFormStructureStore());
    return computed(() => {
        const gp = computedGrandparentJsonPath(layout);
        if (!gp || !jsonSchema.value || !layout) {
            return false;
        }
        const required = pointer.get(jsonSchema.value, gp.value + '/required');
        if (!required) return false;

        return required.includes(layout?.scope.split('/').pop());
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