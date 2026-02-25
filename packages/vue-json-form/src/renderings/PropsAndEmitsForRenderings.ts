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

type GenericComponentType<
    Props = {},
    Slots extends Record<string, any> = {},
    Emits extends Record<string, any[]> = {},
    Exposed extends Record<string, any> = {},
> = DefineComponent<Props, {}, {}, {}, {}, {}, {}, ToRuntimeEmits<Emits>> & {
    new (): { $slots: Slots } & Exposed;
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

export type ArrayButtonComponent = GenericComponentType<
    ArrayButtonProps,
    ArrayButtonSlots,
    ArrayButtonEmits
>;

export type ShowOnWrapperProps = { visible: boolean };
export type ShowOnWrapperSlots = { default: (props: {}) => any };
export type ShowOnWrapperComponent = GenericComponentType<
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
export type FormFieldWrapperComponent = GenericComponentType<
    FormFieldWrapperProps,
    FormFieldWrapperSlots
>;

export type ErrorViewerProps = { header?: string };
export type ErrorViewerSlots = { default: (props: {}) => any };
export type ErrorViewerComponent = GenericComponentType<
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

export type VjfButtonComponent = GenericComponentType<VjfButtonProps>;

export type ButtonGroupProps = {
    /**
     * The UI Schema of this Element
     */
    layoutElement: Buttongroup;
};
export type ButtonGroupComponent = GenericComponentType<ButtonGroupProps>;

export type WizardProgessProps = {
    /** Number of steps in the wizard */
    numberOfPages: number;
    pageNames?: string[];
    currentStep: number;
};
export type WizardProgressEmits = {
    'update:currentStep': [value: number];
};
export type WizardProgressComponent = GenericComponentType<
    WizardProgessProps,
    {},
    WizardProgressEmits
>;

export type ModalProps = {
    /** The UI Schema of this Element */
    layoutElement: Modal;
};

export type ModalComponent = GenericComponentType<ModalProps>;

export type ConfirmationModalProps = {
    title: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    hideConfirmButton?: boolean;
    hideCancelButton?: boolean;
    confirmButtonVariant?: ButtonVariant;
    cancelButtonVariant?: ButtonVariant;
};

export type ConfirmationModalEmits = {
    confirm: [];
    cancel: [];
};

export type ConfirmationModalSlots = {
    default: (props: {}) => any;
};

export type ConfirmationModalComponent = GenericComponentType<
    ConfirmationModalProps,
    ConfirmationModalSlots,
    ConfirmationModalEmits,
    { show: () => void }
>;

export type ControlComponent = GenericComponentType;
