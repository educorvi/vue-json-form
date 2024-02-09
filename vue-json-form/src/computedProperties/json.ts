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

export function computedGrandparentJsonPath() {
    return computed((): string | null => {
        const layout = inject(layoutProviderKey);
        if (!layout) throw new Error('No layout found');

        let path = pointer.parse(layout.scope);

        if (path.length === 0) return null;

        path = path.slice(0, -2);
        return pointer.compile(path);
    });
}

export function computedRequired() {
    const { jsonSchema } = storeToRefs(useFormStructureStore());
    const layout = inject(layoutProviderKey);
    return computed(() => {
        const gp = computedGrandparentJsonPath();
        if (!gp) {
            return false;
        }
        const required = pointer.get(jsonSchema.value, gp + '/required');
        if (!required) return false;

        return required.includes(layout?.scope.split('/').pop());
    });
}

export function computedLabel() {
    function titleCase(string: string) {
        const sentence = string.toLowerCase().split('_');
        for (let i = 0; i < sentence.length; i++) {
            sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
        }

        return sentence.join(' ');
    }

    const layout = inject(layoutProviderKey);
    const { jsonSchema } = storeToRefs(useFormStructureStore());
    return computed(() => {
        return (
            pointer.get(jsonSchema, layout?.scope).title ||
            titleCase(layout?.scope.split('/').pop() || '')
        ).concat(computedRequired().value ? ' *' : '');
    });
}
