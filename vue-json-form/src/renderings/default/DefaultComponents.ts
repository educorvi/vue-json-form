import type { RenderInterface } from '@/RenderInterface';
import { defineAsyncComponent } from 'vue';

export const defaultComponents: Required<RenderInterface> = {
    showOnWrapper: defineAsyncComponent(() => import('@/renderings/default/showOnWrapper.vue')),
    ArrayControl: defineAsyncComponent(
        () => import('@/renderings/default/controls/Array/ArrayControl.vue')
    ),
    CheckboxControl: defineAsyncComponent(
        () => import('@/renderings/default/controls/CheckboxControl.vue')
    ),
    CheckboxGroupControl: defineAsyncComponent(
        () => import('@/renderings/default/controls/CheckboxGroupControl.vue')
    ),
    DefaultControl: defineAsyncComponent(
        () => import('@/renderings/default/controls/DefaultControl.vue')
    ),
    FileControl: defineAsyncComponent(
        () => import('@/renderings/default/controls/FileControl.vue')
    ),
    NumberControl: defineAsyncComponent(
        () => import('@/renderings/default/controls/NumberControl.vue')
    ),
    ObjectControl: defineAsyncComponent(
        () => import('@/renderings/default/controls/ObjectControl.vue')
    ),
    RadiobuttonControl: defineAsyncComponent(
        () => import('@/renderings/default/controls/RadiobuttonControl.vue')
    ),
    SelectControl: defineAsyncComponent(
        () => import('@/renderings/default/controls/SelectControl.vue')
    ),
    StringControl: defineAsyncComponent(
        () => import('@/renderings/default/controls/StringControl.vue')
    ),
    TagsControl: defineAsyncComponent(
        () => import('@/renderings/default/controls/TagsControl.vue')
    ),
    FormFieldWrapper: defineAsyncComponent(
        () => import('@/renderings/default/FormFieldWrapper.vue')
    ),
};
