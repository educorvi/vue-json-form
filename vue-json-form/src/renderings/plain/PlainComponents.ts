import type { RenderInterface } from '@/RenderInterface';
import { defineAsyncComponent } from 'vue';

export const plainComponents: Required<RenderInterface> = {
    showOnWrapper: defineAsyncComponent(
        () => import('@/renderings/plain/showOnWrapper.vue')
    ),
    ArrayControl: defineAsyncComponent(
        () => import('@/renderings/plain/controls/Array/ArrayControl.vue')
    ),
    CheckboxControl: defineAsyncComponent(
        () => import('@/renderings/plain/controls/CheckboxControl.vue')
    ),
    CheckboxGroupControl: defineAsyncComponent(
        () => import('@/renderings/plain/controls/CheckboxGroupControl.vue')
    ),
    DefaultControl: defineAsyncComponent(
        () => import('@/renderings/plain/controls/DefaultControl.vue')
    ),
    FileControl: defineAsyncComponent(
        () => import('@/renderings/plain/controls/FileControl.vue')
    ),
    NumberControl: defineAsyncComponent(
        () => import('@/renderings/plain/controls/NumberControl.vue')
    ),
    ObjectControl: defineAsyncComponent(
        () => import('@/renderings/plain/controls/ObjectControl.vue')
    ),
    RadiobuttonControl: defineAsyncComponent(
        () => import('@/renderings/plain/controls/RadiobuttonControl.vue')
    ),
    SelectControl: defineAsyncComponent(
        () => import('@/renderings/plain/controls/SelectControl.vue')
    ),
    StringControl: defineAsyncComponent(
        () => import('@/renderings/plain/controls/StringControl.vue')
    ),
    TagsControl: defineAsyncComponent(
        () => import('@/renderings/plain/controls/TagsControl.vue')
    ),
    FormFieldWrapper: defineAsyncComponent(
        () => import('@/renderings/plain/FormFieldWrapper.vue')
    ),
    ErrorViewer: defineAsyncComponent(
        () => import('@/renderings/plain/ErrorViewer.vue')
    ),
    Button: defineAsyncComponent(
        () => import('@/renderings/plain/Buttons/VJFButton.vue')
    ),
    Buttongroup: defineAsyncComponent(
        () => import('@/renderings/plain/Buttons/ButtonGroup.vue')
    ),
};
