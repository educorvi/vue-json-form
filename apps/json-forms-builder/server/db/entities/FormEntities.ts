import "reflect-metadata"
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";
import { Layouts, StringFormats, BooleanFormats, EnumFormats, HttpsMethods, ButtonSubmitActions, ButtonVariants, ModalSizes, FileTypes, DependencyTypes, DependencyRelation } from "./FormEntityEnums";


// TODO draw class diagram to check relations and extensions

// TODO take entity as base class from henrik (basetimestampedentity) instead
export abstract class DatabaseEntity {
    @PrimaryGeneratedColumn({ type: "int" })
    id!: number;

    @CreateDateColumn({ type: "timestamp" })
    created!: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updated!: Date;

    @DeleteDateColumn({ type: "timestamp", nullable: true })
    deleted!: Date | null;
}

@Entity()
export class Dependency extends DatabaseEntity {
    @ManyToOne(() => SimpleElement, (simpleElement) => simpleElement.partOfDependency)
    source!: SimpleElement; // on which element the target depends

    @Column({ type: "enum", enum: DependencyTypes })
    dependencyType!: DependencyTypes;

    @Column({ type: "simple-json" })
    value!: number | string | boolean; // the value to compare to, e.g. for "greaterThan", the value that the source should be greater than; for "contains", the value that should be contained in the source; etc.

    @ManyToOne(
        () => DependencyGroup,
        (dependencyGroup) => dependencyGroup.deps
    )
    dependencyGroup!: DependencyGroup;
}

@Entity()
export class DependencyGroup extends DatabaseEntity {
    @OneToMany(
        () => Dependency,
        (dependency) => dependency.dependencyGroup,
        { nullable: true }
    )
    deps!: Dependency[];

    @OneToMany(
        () => DependencyGroup,
        (dep_group) => dep_group.parentDepGroup,
        { nullable: true }
    )
    depGroups!: DependencyGroup[];

    @ManyToOne( // back reference for dep_groups
        () => DependencyGroup,
        (dep_group) => dep_group.depGroups,
        { nullable: true }
    )
    parentDepGroup?: DependencyGroup; // the parent dependency group, if this is a nested dependency group

    // in the final json/ui schema: generate one list that consists of all dependencies and dependency groups (combined with the specified relation)

    @Column({ type: "enum", enum: DependencyRelation })
    relation!: DependencyRelation; // "AND" or "OR"
}

export abstract class FormElement extends DatabaseEntity {
    /*
    class for input and ui elements
    */
    @ManyToOne(() => ContainerElement, (containerElement) => containerElement.children, { nullable: true })
    parent?: ContainerElement;

    @OneToOne(() => DependencyGroup, { nullable: true })
    @JoinColumn()
    dependencyGroup?: DependencyGroup;
}

export abstract class BaseDataElement extends FormElement {
    /*
    class for all input elements like string/checkboxes/... and array/object
    */
    @Column({ type: 'varchar', length: 255 })
    title!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'text', nullable: true })
    tooltip?: string;

    @Column({ type: 'boolean', default: false })
    hidden!: boolean;

    @Column({ type: 'text', nullable: true })
    preHtml?: string; // TODO remove if htmlelement is allowed inside of array/object

    @Column({ type: 'text', nullable: true })
    postHtml?: string; // TODO remove if htmlelement is allowed inside of array/object
}

export abstract class SimpleElement extends BaseDataElement {
    @Column({ type: 'boolean', default: false })
    required!: boolean;

    @Column({ type: 'varchar', length: 255, nullable: true })
    appendValue?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    prependValue?: string;

    // constraint valid pattern
    @Column({ type: 'varchar', length: 255, nullable: true })
    pattern?: string;

    // one can depend on a simpleelement only
    @OneToMany(() => Dependency, (dependency) => dependency.source, { nullable: true })
    partOfDependency?: Dependency[]; // to show warnings in the ui if someone want to delete this element and it is used in a dependency
}

export abstract class ContainerElement extends BaseDataElement {
    @OneToMany(() => FormElement, (formElement) => formElement.parent)
    children!: FormElement[]; // TODO how to save the order of the children?

    @Column({ type: "enum", enum: Layouts })
    layout!: Layouts;

    @Column({ type: 'boolean', default: true })
    showTitle!: boolean;
}

@Entity()
export class ArrayElement extends ContainerElement {
    @Column({ type: 'boolean', default: false })
    required!: boolean; // TODO maybe move to basedataelement (and object also has required in database, but not in ui. object can currently be the source )

    // constraint >= 0
    @Column({ type: "int", nullable: true })
    minItems?: number;

    // constraint >=0 and minItems < maxItems
    @Column({ type: "int", nullable: true })
    maxItems?: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    buttonLabel?: string;
}

@Entity()
export class ObjectElement extends ContainerElement {
    // TODO back reference to wizard page (optional)
}

@Entity()
export class StringElement extends SimpleElement {
    @Column({ type: "enum", enum: StringFormats })
    format!: StringFormats;

    // constraint >= 0
    @Column({ type: "int", nullable: true })
    minLength?: number;

    // constraint >=0 and minLength < maxLength
    @Column({ type: "int", nullable: true })
    maxLength?: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    placeholder?: string;
}

@Entity()
export class NumberElement extends SimpleElement {
    @Column({ type: "float", nullable: true })
    minimum?: number;

    // constraint minimum < maximum
    @Column({ type: "float", nullable: true })
    maximum?: number;

    // minimum of 0
    @Column({ type: "float", nullable: true })
    multipleOf?: number;
}

@Entity()
export class BooleanElement extends SimpleElement {
    @Column({ type: "enum", enum: BooleanFormats })
    format!: BooleanFormats;

    @Column({ type: 'boolean', default: false })
    mustBeTrue!: boolean;
}

export abstract class SelectionElement extends SimpleElement {
    @Column({ type: 'boolean', default: false })
    useIdInSchema!: boolean;

    @Column({ type: "simple-array", nullable: true }) // TODO save with id-title pairs
    selectionOptions?: string[]; // for select and radio, the options are the possible values; for checkbox group, the options are the labels of the checkboxes
}

@Entity()
export class EnumElement extends SelectionElement {
    @Column({ type: "enum", enum: EnumFormats })
    format!: EnumFormats;
}

@Entity()
export class CheckboxGroup extends SelectionElement {

}

@Entity()
export class FileuploadElement extends SimpleElement {
    // constraint >= 0
    @Column({ type: "int", nullable: true })
    minItems?: number;

    // constraint >=0 and minItems < maxItems
    @Column({ type: "int", nullable: true })
    maxItems?: number;

    @Column({ type: "enum", enum: FileTypes, nullable: true })
    possibleFileTypes?: FileTypes[];

    @Column({ type: "int", nullable: true })
    maxFileSizeInBytes?: number;

    // @Column()
    // displayAsArray: boolean;
}

@Entity()
export class ReferenceElement extends FormElement {
    // id of the referenced element (of type )
    @ManyToOne(() => FormElement)
    referenceId!: FormElement;
}

@Entity()
export class HTMLElement extends FormElement {
    @Column({ type: "text" })
    htmlText!: string;
}

@Entity()
export class ModalElement extends FormElement {
    @Column({ type: "varchar", length: 255 })
    title!: string;

    @Column({ type: "text" })
    content!: string;

    @Column({ type: "enum", enum: ModalSizes, default: ModalSizes.Medium })
    size!: ModalSizes;

    @Column({ type: "varchar", length: 255 })
    buttonLabel!: string;

    @Column({ type: "enum", enum: ButtonVariants, default: ButtonVariants.Primary })
    variant!: ButtonVariants;
}

@Entity()
export class ButtonGroup extends FormElement {
    @OneToMany(() => Button, (button) => button.buttonGroup)
    buttons!: Button[]; // TODO how to save the order of the buttons?
}

export abstract class Button extends FormElement {
    @Column({ type: "varchar", length: 255 })
    label!: string;

    @Column({ type: 'boolean', default: false })
    disabled!: boolean;

    @Column({ type: "enum", enum: ButtonVariants })
    variant!: ButtonVariants;

    // TODO: if button is in a buttongroup and not in an array/object/form, then what is the parent? (parent must be a container so an array or object)
    @ManyToOne(() => ButtonGroup, (buttonGroup) => buttonGroup.buttons, { nullable: true })
    buttonGroup?: ButtonGroup;
}

@Entity()
export class ResetButton extends Button {

}

@Entity()
export class SubmitButton extends Button {
    @Column({ type: "enum", enum: ButtonSubmitActions })
    submitAction!: ButtonSubmitActions;

    @Column({ type: 'varchar', length: 255 })
    submitUrl!: string;

    @Column({ type: "enum", enum: HttpsMethods , default: HttpsMethods.Post })
    submitMethod!: HttpsMethods;

    @Column({ type: 'text', nullable: true })
    requestHeaders?: string; // JSON string of key-value pairs

    @Column({ type: 'varchar', length: 255, nullable: true })
    onSuccessRedirectUrl?: string;

    // TODO summary from ui schema definition?
}

@Entity()
export class WizardPage extends DatabaseEntity { // TODO or extend from object element and dont reference a form?
    @ManyToOne(() => Wizard, (wizard) => wizard.wizardPages)
    wizard!: Wizard;

    @OneToOne(() => ObjectElement, (objectElement) => objectElement.id)
    form!: ObjectElement; // the form that is displayed on this page of the wizard

    @Column({ type: 'varchar', length: 255 })
    pageTitle!: string;

    @Column({ type: "int" })
    position!: number; // position of the page in the wizard (starting from 0)
}

@Entity()
export class Wizard extends DatabaseEntity {
    @OneToMany(() => WizardPage, (wizardPage) => wizardPage.wizard)
    wizardPages!: WizardPage[];

    @Column({ type: 'varchar', length: 255 })
    title!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;
}


