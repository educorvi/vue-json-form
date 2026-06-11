import "reflect-metadata"
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { Layouts, StringFormats, BooleanFormats, EnumFormats, HttpsMethods, ButtonSubmitActions, ButtonVariants, ModalSizes, FileTypes, DependencyTypes, DependencyRelation } from "./FormEntityEnums";


// TODO draw class diagram to check relations and extensions

// TODO take entity as base class from henrik (basetimestampedentity) instead
export abstract class DatabaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    created: Date;

    @Column()
    updated: Date;
}

@Entity()
export class Dependency extends DatabaseEntity {
    @ManyToOne(() => SimpleElement, (simpleElement) => simpleElement.partOfDependency)
    source: SimpleElement; // on which element the target depends

    @Column()
    dependencyType: DependencyTypes;

    @Column()
    value: number | string | boolean; // the value to compare to, e.g. for "greaterThan", the value that the source should be greater than; for "contains", the value that should be contained in the source; etc.

    @ManyToOne(() => DependencyGroup, (dependencyGroup) => dependencyGroup.dependencies)
    dependencyGroup: DependencyGroup;
}

@Entity()
export class DependencyGroup extends DatabaseEntity {
    @OneToMany(() => Dependency | DependencyGroup, (dependency) => dependency.dependencyGroup)
    dependencies: Dependency[] | DependencyGroup []; // TODO how does it work that both types are possible?

    @Column()
    dependencyRelation: DependencyRelation; // "AND" or "OR"
}

export abstract class FormElement extends DatabaseEntity {
    /*
    class for input and ui elements
    */
    @ManyToOne(() => ContainerElement, (containerElement) => containerElement.children)
    parent: ContainerElement;

    @OneToOne(() => DependencyGroup)
    @JoinColumn()
    dependencyGroup: DependencyGroup;
}

export abstract class BaseDataElement extends FormElement {
    /*
    class for all input elements like string/checkboxes/... and array/object
    */
    @Column()
    title: string;

    @Column({ nullable: true })
    description?: string;

    @Column({ nullable: true })
    tooltip?: string;

    @Column()
    hidden: boolean;

    @Column({ nullable: true })
    preHtml?: string; // TODO remove if htmlelement is allowed inside of array/object

    @Column({ nullable: true })
    postHtml?: string; // TODO remove if htmlelement is allowed inside of array/object
}

export abstract class SimpleElement extends BaseDataElement {
    @Column()
    required: boolean;

    @Column({ nullable: true })
    appendValue?: string;

    @Column({ nullable: true })
    prependValue?: string;

    // constraint valid pattern
    @Column({ nullable: true })
    pattern?: string;

    // one can depend on a simpleelement only
    @OneToMany(() => Dependency, (dependency) => dependency.source, { nullable: true })
    partOfDependency?: Dependency[]; // to show warnings in the ui if someone want to delete this element and it is used in a dependency
}

export abstract class ContainerElement extends BaseDataElement {
    @OneToMany(() => FormElement, (formElement) => formElement.parent)
    children: FormElement[]; // TODO how to save the order of the children?

    @Column()
    layout: Layouts;

    @Column()
    showTitle: boolean;
}

@Entity()
export class ArrayElement extends ContainerElement {
    @Column()
    required: boolean; // TODO maybe move to basedataelement (and object also has required in database, but not in ui. object can currently be the source )

    // constraint >= 0
    @Column({ nullable: true })
    minItems?: number;

    // constraint >=0 and minItems < maxItems
    @Column({ nullable: true })
    maxItems?: number;

    @Column({ nullable: true })
    buttonLabel?: string;
}

@Entity()
export class ObjectElement extends ContainerElement {
    @ManyToOne(() => Wizard, (wizard) => wizard.forms, { nullable: true })
    wizard?: Wizard; // if object is a form that is used in a wizard
}

@Entity()
export class StringElement extends SimpleElement {
    @Column()
    format: StringFormats;

    // constraint >= 0
    @Column({ nullable: true })
    minLength?: number;
    
    // constraint >=0 and minLength < maxLength
    @Column({ nullable: true })
    maxLength?: number;

    @Column({ nullable: true })
    placeholder?: string;
}

@Entity()
export class NumberElement extends SimpleElement {
    @Column({ nullable: true })
    minimum?: number;

    // constraint minimum < maximum
    @Column({ nullable: true })
    maximum?: number;

    // minimum of 0
    @Column({ nullable: true, type: "float" })
    multipleOf?: number;
}

@Entity()
export class BooleanElement extends SimpleElement {
    @Column()
    format: BooleanFormats;

    @Column()
    mustBeTrue: boolean;
}

export abstract class SelectionElement extends SimpleElement {
    @Column()
    useIdInSchema: boolean;

    @Column() // TODO save with id-title pairs
    selectionOptions: string[]; // for select and radio, the options are the possible values; for checkbox group, the options are the labels of the checkboxes
}

@Entity()
export class EnumElement extends SelectionElement {
    @Column()
    format: EnumFormats;
}

@Entity()
export class CheckboxGroup extends SelectionElement {

}

@Entity()
export class FileuploadElement extends SimpleElement {
    // constraint >= 0
    @Column({ nullable: true })
    minItems?: number;

    // constraint >=0 and minItems < maxItems
    @Column({ nullable: true })
    maxItems?: number;

    @Column({ nullable: true })
    possibleFileTypes?: FileTypes[];

    @Column({ nullable: true })
    maxFileSizeInBytes?: number;

    // @Column()
    // displayAsArray: boolean;
}

@Entity()
export class ReferenceElement extends FormElement {
    // id of the referenced element (of type )
    @ManyToOne(() => FormElement)
    referenceId: number;
}

@Entity()
export class HTMLElement extends FormElement {
    @Column()
    htmlText: string;
}

@Entity()
export class ModalElement extends FormElement {
    @Column()
    title: string;

    @Column()
    content: string;

    @Column({ default: ModalSizes.Medium })
    size: ModalSizes;

    @Column()
    buttonLabel: string;

    @Column({ default: ButtonVariants.Primary })
    variant: ButtonVariants;
}

@Entity()
export class ButtonGroup extends FormElement {
    @OneToMany(() => Button, (button) => button.buttonGroup)
    buttons: Button[]; // TODO how to save the order of the buttons?
}

export abstract class Button extends FormElement {
    @Column()
    label: string;

    @Column()
    disabled: boolean;

    @Column()
    variant: ButtonVariants;

    // TODO: if button is in a buttongroup and not in an array/object/form, then what is the parent? (parent must be a container so an array or object)
    @ManyToOne(() => ButtonGroup, (buttonGroup) => buttonGroup.buttons, { nullable: true })
    buttonGroup?: ButtonGroup;
}

@Entity()
export class ResetButton extends Button {

}

@Entity()
export class SubmitButton extends Button {
    @Column()
    submitAction: ButtonSubmitActions;

    @Column()
    submitUrl: string;

    @Column({ default: HttpsMethods.Post })
    submitMethod: HttpsMethods;

    @Column({ nullable: true })
    requestHeaders?: string; // JSON string of key-value pairs

    @Column({ nullable: true })
    onSuccessRedirectUrl?: string;

    // TODO summary from ui schema definition?
}

@Entity()
export class Wizard extends DatabaseEntity {
    @OneToMany(() => ObjectElement, (objectElement) => objectElement.wizard)
    forms: ObjectElement[]; // TODO how to save the order of the forms?

    @Column()
    pageTitles: string[]; // TODO instead create class WizardPage (which extends object) and has pageTitle attribute. to guarantee that there are as many pagetitles as there are forms
}


