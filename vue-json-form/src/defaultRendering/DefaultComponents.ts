import type { RenderInterface } from '@/RenderInterface';
import { defineAsyncComponent } from 'vue';
import { storeToRefs } from 'pinia';
import { useFormStructureStore } from '@/stores/formStructure';

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

export const defaultComponents: Required<RenderInterface> = {
    showOnWrapper: defineAsyncComponent(() => import('@/defaultRendering/showOnWrapper.vue')),
    ArrayControl: defineAsyncComponent(
        () => import('@/defaultRendering/controls/Array/ArrayControl.vue')
    ),
    CheckboxControl: defineAsyncComponent(
        () => import('@/defaultRendering/controls/CheckboxControl.vue')
    ),
    CheckboxGroupControl: defineAsyncComponent(
        () => import('@/defaultRendering/controls/CheckboxGroupControl.vue')
    ),
    DateTimeControl: defineAsyncComponent(
        () => import('@/defaultRendering/controls/DateTimeControl.vue')
    ),
    DefaultControl: defineAsyncComponent(
        () => import('@/defaultRendering/controls/DefaultControl.vue')
    ),
    FileControl: defineAsyncComponent(() => import('@/defaultRendering/controls/FileControl.vue')),
    NumberControl: defineAsyncComponent(
        () => import('@/defaultRendering/controls/NumberControl.vue')
    ),
    ObjectControl: defineAsyncComponent(
        () => import('@/defaultRendering/controls/ObjectControl.vue')
    ),
    RadiobuttonControl: defineAsyncComponent(
        () => import('@/defaultRendering/controls/RadiobuttonControl.vue')
    ),
    SelectControl: defineAsyncComponent(
        () => import('@/defaultRendering/controls/SelectControl.vue')
    ),
    StringControl: defineAsyncComponent(
        () => import('@/defaultRendering/controls/StringControl.vue')
    ),
    TagsControl: defineAsyncComponent(() => import('@/defaultRendering/controls/TagsControl.vue')),
};
