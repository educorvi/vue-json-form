import { defineStore, storeToRefs } from 'pinia';
import { type Ref, shallowRef } from 'vue';
import { ref } from 'vue';
import type { Layout, UISchema } from '@/typings/ui-schema';
import type { CoreSchemaMetaSchema } from '@/typings/json-schema';
import type { RenderInterface } from '@/RenderInterface';
import { defaultComponents as defaultCompImport } from '@/renderings/default/DefaultComponents';
import { bootstrapComponents } from '@/renderings/bootstrap/BootstrapComponents';

const defaultComponents: Required<RenderInterface> = defaultCompImport;

export const useFormStructureStore = defineStore('formStructure', () => {
    const jsonSchema: Ref<CoreSchemaMetaSchema | null> = ref(null);
    const uiSchema: Ref<Layout | null> = ref(null);

    const components: Ref<RenderInterface | undefined> = ref(undefined);

    /**
     * List of all arrays in the schema that were written to
     */
    const arrays: Ref<Array<string>> = ref([]);

    return { jsonSchema, uiSchema, components, arrays };
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
