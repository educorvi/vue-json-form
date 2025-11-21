import type { RenderInterface } from '@/RenderInterface';
import { defineAsyncComponent } from 'vue';
import './styling.scss';
import 'bootstrap-vue-next/src/styles/styles.scss';
import ArrayButton from '@/renderings/bootstrap/controls/Array/ArrayButton.vue';
import ShowOnWrapper from '@/renderings/bootstrap/showOnWrapper.vue';
import WizardProgress from '@/renderings/bootstrap/WizardProgress.vue';

export const bootstrapComponents: Required<RenderInterface> = {
    showOnWrapper: ShowOnWrapper,
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
    ErrorViewer: defineAsyncComponent(
        () => import('@/renderings/bootstrap/ErrorViewer.vue')
    ),
    Button: defineAsyncComponent(
        () => import('@/renderings/bootstrap/Buttons/VJFButton.vue')
    ),
    Buttongroup: defineAsyncComponent(
        () => import('@/renderings/bootstrap/Buttons/ButtonGroup.vue')
    ),
    HelpPopover: defineAsyncComponent(
        () => import('@/renderings/bootstrap/HelpPopover.vue')
    ),
    DefaultControl: defineAsyncComponent(
        () => import('@/renderings/bootstrap/controls/DefaultControl.vue')
    ),
    ArrayButton: ArrayButton,
    WizardProgress: WizardProgress,
};
