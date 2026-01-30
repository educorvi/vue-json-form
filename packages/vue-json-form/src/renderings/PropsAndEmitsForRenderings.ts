import type { DefineComponent } from 'vue';
import type { ButtonVariant } from 'bootstrap-vue-next';
import type {
    Button,
    Buttongroup,
    Modal,
} from '@educorvi/vue-json-form-schemas';

type ToRuntimeEmits<T> = {
    [K in keyof T]: T[K] extends any[] ? (...args: T[K]) => boolean : any;
};

type ComponentWithPropsEmitsAndSlots<
    Props = {},
    Slots extends Record<string, any> = {},
    Emits extends Record<string, any[]> = {},
> = DefineComponent<Props, {}, {}, {}, {}, {}, {}, ToRuntimeEmits<Emits>> & {
    // This forces strict slot typing on the component instance
    new (): { $slots: Slots };
};

export interface ArrayButtonProps {
    disabled?: boolean;
    ariaLabel?: string;
    variant?: ButtonVariant;
}

export type ArrayButtonEmits = {
    click: [];
};

export type ArrayButtonSlots = {
    default: (props: {}) => any;
};

export type ArrayButtonComponent = ComponentWithPropsEmitsAndSlots<
    ArrayButtonProps,
    ArrayButtonSlots,
    ArrayButtonEmits
>;

export type ShowOnWrapperProps = { visible: boolean };
export type ShowOnWrapperSlots = { default: (props: {}) => any };
export type ShowOnWrapperComponent = ComponentWithPropsEmitsAndSlots<
    ShowOnWrapperProps,
    ShowOnWrapperSlots
>;

export type FormFieldWrapperProps = {
    label: string;
    labelFor: string;
};
export type FormFieldWrapperSlots = {
    default: (props: {}) => any;
    prepend?: (props: {}) => any;
    append?: (props: {}) => any;
};
export type FormFieldWrapperComponent = ComponentWithPropsEmitsAndSlots<
    FormFieldWrapperProps,
    FormFieldWrapperSlots
>;

export type ErrorViewerProps = { header?: string };
export type ErrorViewerSlots = { default: (props: {}) => any };
export type ErrorViewerComponent = ComponentWithPropsEmitsAndSlots<
    ErrorViewerProps,
    ErrorViewerSlots
>;

export type VjfButtonProps = {
    /**
     * The UI Schema of this Element
     */
    layoutElement: Button;

    /**
     * Show spinner
     */
    waiting?: boolean;
};

export type VjfButtonComponent =
    ComponentWithPropsEmitsAndSlots<VjfButtonProps>;

export type ButtonGroupProps = {
    /**
     * The UI Schema of this Element
     */
    layoutElement: Buttongroup;
};
export type ButtonGroupComponent =
    ComponentWithPropsEmitsAndSlots<ButtonGroupProps>;

export type WizardProgessProps = {
    /** Number of steps in the wizard */
    numberOfPages: number;
    pageNames?: string[];
    currentStep: number;
};
export type WizardProgressEmits = {
    'update:currentStep': [value: number];
};
export type WizardProgressComponent = ComponentWithPropsEmitsAndSlots<
    WizardProgessProps,
    {},
    WizardProgressEmits
>;

export type ModalProps = {
    /** The UI Schema of this Element */
    layoutElement: Modal;
};

export type ModalComponent = ComponentWithPropsEmitsAndSlots<ModalProps>;

export type ControlComponent = ComponentWithPropsEmitsAndSlots;
