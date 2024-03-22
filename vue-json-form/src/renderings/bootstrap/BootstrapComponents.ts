import type { RenderInterface } from '@/RenderInterface';
import { defineAsyncComponent } from 'vue';

export const bootstrapComponents: RenderInterface = {
    showOnWrapper: defineAsyncComponent(() => import('@/renderings/bootstrap/showOnWrapper.vue')),
    ArrayControl: defineAsyncComponent(
        () => import('@/renderings/bootstrap/controls/Array/ArrayControl.vue')
    ),
    CheckboxControl: defineAsyncComponent(
        () => import('@/renderings/bootstrap/controls/CheckboxControl.vue')
    ),
    CheckboxGroupControl: defineAsyncComponent(
        () => import('@/renderings/bootstrap/controls/CheckboxGroupControl.vue')
    ),
    FileControl: defineAsyncComponent(
        () => import('@/renderings/bootstrap/controls/FileControl.vue')
    ),
    NumberControl: defineAsyncComponent(
        () => import('@/renderings/bootstrap/controls/NumberControl.vue')
    ),
    ObjectControl: defineAsyncComponent(
        () => import('@/renderings/bootstrap/controls/ObjectControl.vue')
    ),
    RadiobuttonControl: defineAsyncComponent(
        () => import('@/renderings/bootstrap/controls/RadiobuttonControl.vue')
    ),
    SelectControl: defineAsyncComponent(
        () => import('@/renderings/bootstrap/controls/SelectControl.vue')
    ),
    StringControl: defineAsyncComponent(
        () => import('@/renderings/bootstrap/controls/StringControl.vue')
    ),
    TagsControl: defineAsyncComponent(
        () => import('@/renderings/bootstrap/controls/TagsControl.vue')
    ),
    FormFieldWrapper: defineAsyncComponent(
        () => import('@/renderings/bootstrap/FormFieldWrapper.vue')
    ),
    ErrorViewer: defineAsyncComponent(() => import('@/renderings/bootstrap/ErrorViewer.vue')),
};
