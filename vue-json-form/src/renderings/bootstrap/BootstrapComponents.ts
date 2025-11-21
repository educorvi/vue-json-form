import type { RenderInterface } from '@/RenderInterface';
import { defineAsyncComponent } from 'vue';
import './styling.scss';
import 'bootstrap-vue-next/src/styles/styles.scss';
import ArrayButton from '@/renderings/bootstrap/controls/Array/ArrayButton.vue';
import ShowOnWrapper from '@/renderings/bootstrap/showOnWrapper.vue';
import WizardProgress from '@/renderings/bootstrap/WizardProgress.vue';
import HelpPopover from '@/renderings/bootstrap/HelpPopover.vue';
import ErrorViewer from '@/renderings/bootstrap/ErrorViewer.vue';
import DefaultControl from '@/renderings/bootstrap/controls/DefaultControl.vue';
import CheckboxControl from '@/renderings/bootstrap/controls/CheckboxControl.vue';
import CheckboxGroupControl from '@/renderings/bootstrap/controls/CheckboxGroupControl.vue';
import NumberControl from '@/renderings/bootstrap/controls/NumberControl.vue';
import VJFButton from '@/renderings/bootstrap/Buttons/VJFButton.vue';
import ButtonGroup from '@/renderings/bootstrap/Buttons/ButtonGroup.vue';
import ObjectControl from '@/renderings/bootstrap/controls/ObjectControl.vue';

export const bootstrapComponents: Required<RenderInterface> = {
    showOnWrapper: ShowOnWrapper,
    CheckboxControl: CheckboxControl,
    CheckboxGroupControl: CheckboxGroupControl,
    FileControl: defineAsyncComponent(
        () => import('@/renderings/bootstrap/controls/FileControl.vue')
    ),
    NumberControl: NumberControl,
    ObjectControl: ObjectControl,
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
    ErrorViewer: ErrorViewer,
    Button: VJFButton,
    Buttongroup: ButtonGroup,
    HelpPopover: HelpPopover,
    DefaultControl: DefaultControl,
    ArrayButton: ArrayButton,
    WizardProgress: WizardProgress,
};
