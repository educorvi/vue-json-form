import type {
    ArrayButtonComponent,
    ButtonGroupComponent,
    ControlComponent,
    ErrorViewerComponent,
    FormFieldWrapperComponent,
    ModalComponent,
    ShowOnWrapperComponent,
    VjfButtonComponent,
    WizardProgressComponent,
} from '@/renderings/PropsAndEmitsForRenderings.ts';

export interface RenderInterface {
    /**
     * Wrapper component for showOn
     */
    showOnWrapper: ShowOnWrapperComponent;

    FormFieldWrapper: FormFieldWrapperComponent;

    ArrayButton: ArrayButtonComponent;

    ErrorViewer: ErrorViewerComponent;

    Button: VjfButtonComponent;

    Buttongroup: ButtonGroupComponent;

    HelpPopover: ControlComponent;

    WizardProgress: WizardProgressComponent;

    Modal: ModalComponent;

    CheckboxControl: ControlComponent;

    CheckboxGroupControl: ControlComponent;

    DefaultControl: ControlComponent;

    FileControl: ControlComponent;

    NumberControl: ControlComponent;

    ObjectControl: ControlComponent;

    RadiobuttonControl: ControlComponent;

    SelectControl: ControlComponent;

    StringControl: ControlComponent;

    TagsControl: ControlComponent;
}
