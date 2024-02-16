import { defineStore, storeToRefs } from 'pinia';
import type { Ref } from 'vue';
import { ref } from 'vue';
import type { UISchema } from '@/typings/ui-schema';
import type { CoreSchemaMetaSchema } from '@/typings/json-schema';
import type { RenderInterface } from '@/RenderInterface';
import { defaultComponents } from '@/renderings/default/DefaultComponents';

export const useFormStructureStore = defineStore('formStructure', () => {
    const jsonSchema: Ref<CoreSchemaMetaSchema | null> = ref(null);
    const uiSchema: Ref<UISchema | null> = ref(null);

    const components: Ref<RenderInterface | undefined> = ref(undefined);

    return { jsonSchema, uiSchema, components };
});
/**
 * This function is used to retrieve a component from the provided components object or fall back to the default components if the component is not found.
 *
 * @param {keyof RenderInterface} componentName - The name of the component to retrieve.
 * @returns The retrieved component.
 */
export function getComponent(componentName: keyof RenderInterface) {
    const { components } = storeToRefs(useFormStructureStore());
    return components.value?.[componentName] || defaultComponents[componentName];
}
