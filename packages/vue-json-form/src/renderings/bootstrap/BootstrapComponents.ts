import type { RenderInterface } from '@/renderings/RenderInterface.ts';
import './styling.scss';
import 'bootstrap-vue-next/src/styles/styles.scss';
import ArrayButton from '@/renderings/bootstrap/controls/ArrayButton.vue';
import ShowOnWrapper from '@/renderings/bootstrap/showOnWrapper.vue';
import WizardProgress from '@/renderings/bootstrap/WizardProgress.vue';
import CheckboxControl from '@/renderings/bootstrap/controls/CheckboxControl.vue';
import HelpPopover from '@/renderings/bootstrap/HelpPopover.vue';
import ErrorViewer from '@/renderings/bootstrap/ErrorViewer.vue';
import DefaultControl from '@/renderings/bootstrap/controls/DefaultControl.vue';
import ButtonGroup from '@/renderings/bootstrap/Buttons/ButtonGroup.vue';
import NumberControl from '@/renderings/bootstrap/controls/NumberControl.vue';
import ObjectControl from '@/renderings/bootstrap/controls/ObjectControl.vue';
import TagsControl from '@/renderings/bootstrap/controls/TagsControl.vue';
import CheckboxGroupControl from '@/renderings/bootstrap/controls/CheckboxGroupControl.vue';
import RadiobuttonControl from '@/renderings/bootstrap/controls/RadiobuttonControl.vue';
import SelectControl from '@/renderings/bootstrap/controls/SelectControl.vue';
import StringControl from '@/renderings/bootstrap/controls/StringControl.vue';
import FormFieldWrapper from '@/renderings/bootstrap/FormFieldWrapper.vue';
import VJFButton from '@/renderings/bootstrap/Buttons/VJFButton.vue';
import FileControl from '@/renderings/bootstrap/controls/FileControl.vue';

export const bootstrapComponents: RenderInterface = {
    showOnWrapper: ShowOnWrapper,
    CheckboxControl: CheckboxControl,
    CheckboxGroupControl: CheckboxGroupControl,
    FileControl: FileControl,
    NumberControl: NumberControl,
    ObjectControl: ObjectControl,
    RadiobuttonControl: RadiobuttonControl,
    SelectControl: SelectControl,
    StringControl: StringControl,
    TagsControl: TagsControl,
    FormFieldWrapper: FormFieldWrapper,
    ErrorViewer: ErrorViewer,
    Button: VJFButton,
    Buttongroup: ButtonGroup,
    HelpPopover: HelpPopover,
    DefaultControl: DefaultControl,
    ArrayButton: ArrayButton,
    WizardProgress: WizardProgress,
};
