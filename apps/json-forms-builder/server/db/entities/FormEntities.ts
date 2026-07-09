import { Layouts, StringFormats, BooleanFormats, EnumFormats, HttpsMethods, ButtonSubmitActions, ButtonVariants, ModalSizes, FileTypes, DependencyTypes, DependencyRelation } from "../../schema_generation/FormEntityEnums";



// TODO rename, isnt database entity anymore
export abstract class DatabaseEntity {
    id!: number;
    // created!: Date;
    // updated!: Date;
    // deleted!: Date | null;
}

export class Dependency extends DatabaseEntity {
    source!: SimpleElement; // on which element the target depends

    dependencyType!: DependencyTypes;

    value!: number | string | boolean; // the value to compare to, e.g. for "greaterThan", the value that the source should be greater than; for "contains", the value that should be contained in the source; etc.

    dependencyGroup!: DependencyGroup;
}

export class DependencyGroup extends DatabaseEntity {
    deps!: Dependency[];

    depGroups!: DependencyGroup[];

    parentDepGroup?: DependencyGroup; // the parent dependency group, if this is a nested dependency group

    // in the final json/ui schema: generate one list that consists of all dependencies and dependency groups (combined with the specified relation)

    relation!: DependencyRelation; // "AND" or "OR"
}

export abstract class FormElement extends DatabaseEntity {
    /*
    class for input and ui elements
    */
    parent?: ContainerElement;

    dependencyGroup?: DependencyGroup;
}

export abstract class BaseDataElement extends FormElement {
    /*
    class for all input elements like string/checkboxes/... and array/object
    */
    title!: string;

    description?: string;

    tooltip?: string;

    hidden!: boolean;

    preHtml?: string; // TODO remove if htmlelement is allowed inside of array/object

    postHtml?: string; // TODO remove if htmlelement is allowed inside of array/object
}

export abstract class SimpleElement extends BaseDataElement {
    required!: boolean;

    appendValue?: string;

    prependValue?: string;

    // constraint valid pattern
    pattern?: string;

    // one can depend on a simpleelement only
    partOfDependency?: Dependency[]; // to show warnings in the ui if someone want to delete this element and it is used in a dependency
}

export abstract class ContainerElement extends BaseDataElement {
    children!: FormElement[]; // TODO how to save the order of the children?

    layout!: Layouts;

    showTitle!: boolean;
}

export class ArrayElement extends ContainerElement {
    required!: boolean; // TODO maybe move to basedataelement (and object also has required in database, but not in ui. object can currently be the source )

    // constraint >= 0
    minItems?: number;

    // constraint >=0 and minItems < maxItems
    maxItems?: number;

    buttonLabel?: string;
}


export class ObjectElement extends ContainerElement {
    // TODO back reference to wizard page (optional)
}


export class StringElement extends SimpleElement {
    format!: StringFormats;

    // constraint >= 0
    minLength?: number;

    // constraint >=0 and minLength < maxLength
    maxLength?: number;

    placeholder?: string;
}

export class NumberElement extends SimpleElement {
    minimum?: number;

    // constraint minimum < maximum
    maximum?: number;

    // minimum of 0
    multipleOf?: number;
}

export class BooleanElement extends SimpleElement {
    format!: BooleanFormats;

    mustBeTrue!: boolean;
}

export abstract class SelectionElement extends SimpleElement {
    useIdInSchema!: boolean;

    // TODO save with id-title pairs
    selectionOptions?: string[]; // for select and radio, the options are the possible values; for checkbox group, the options are the labels of the checkboxes
}

export class EnumElement extends SelectionElement {
    format!: EnumFormats;
}

export class CheckboxGroup extends SelectionElement {

}


export class FileuploadElement extends SimpleElement {
    // constraint >= 0
    minItems?: number;

    // constraint >=0 and minItems < maxItems
    maxItems?: number;

    possibleFileTypes?: FileTypes[];

    maxFileSizeInBytes?: number;

    // displayAsArray: boolean;
}


export class ReferenceElement extends FormElement {
    // id of the referenced element (of type )
    referenceId!: FormElement;
}


export class HTMLElement extends FormElement {
    htmlText!: string;
}


export class ModalElement extends FormElement {
    title!: string;

    content!: string;

    size!: ModalSizes;

    buttonLabel!: string;

    variant!: ButtonVariants;
}

export class ButtonGroup extends FormElement {
    buttons!: Button[]; // TODO how to save the order of the buttons?
}

export abstract class Button extends FormElement {
    label!: string;

    disabled!: boolean;

    variant!: ButtonVariants;

    // TODO: if button is in a buttongroup and not in an array/object/form, then what is the parent? (parent must be a container so an array or object)
    buttonGroup?: ButtonGroup;
}

export class ResetButton extends Button {

}

export class SubmitButton extends Button {
    submitAction!: ButtonSubmitActions;

    submitUrl!: string;

    submitMethod!: HttpsMethods;

    requestHeaders?: string; // JSON string of key-value pairs

    onSuccessRedirectUrl?: string;

    // TODO summary from ui schema definition?
}

export class WizardPage extends DatabaseEntity { // TODO or extend from object element and dont reference a form?
    wizard!: Wizard;

    form!: ObjectElement; // the form that is displayed on this page of the wizard

    pageTitle!: string;

    position!: number; // position of the page in the wizard (starting from 0)
}

export class Wizard extends DatabaseEntity {
    wizardPages!: WizardPage[];

    title!: string;

    description?: string;
}


