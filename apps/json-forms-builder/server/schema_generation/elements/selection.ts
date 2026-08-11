import { z } from "zod";
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { SimpleElement, SimpleElementOptionalKeys } from "./form-element";
import type { SchemaGenerator } from "./schema-generator";
import { PartialBy } from "./base";
import { createShowOnProperty } from "./children-schema-utils";


enum EnumFormat {
    Select = "select",
    Radio = "radio"
}


type SelectionElementData = z.infer<typeof SelectionElement.schema>;
const selectionElementDefaults = {useIdInSchema: false, selectionOptions: [] as string[]};
type SelectionElementOptionalKeys = keyof typeof selectionElementDefaults | SimpleElementOptionalKeys;

export abstract class SelectionElement extends SimpleElement {
    data: SelectionElementData;

    static schema = SimpleElement.schema.extend({
        useIdInSchema: z.boolean(),
        // TODO save with id-title pairs
        selectionOptions: z.array(z.string()) // for select and radio, the options are the possible values; for checkbox group, the options are the labels of the checkboxes
    });

    constructor(
        data: PartialBy<SelectionElementData, SelectionElementOptionalKeys>
    ) {
        super(data);
        this.data = SelectionElement.setDefaults(data);
    }

    protected static setDefaults(data: PartialBy<SelectionElementData, SelectionElementOptionalKeys>): SelectionElementData {
        return {
            ...super.setDefaults(data),
            ...selectionElementDefaults,
            ...data,
        };
    }

    get useIdInSchema(): boolean {
        return this.data.useIdInSchema;
    }

    get selectionOptions(): string[] {
        return this.data.selectionOptions;
    }

    toUiSchema(generator: SchemaGenerator, scope: string[]): Control {
        // TODO stuff that applies to all sub classes
    }

    toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema {
        // TODO stuff that applies to all sub classes
    }

    fromJsonSchemaAndUiSchema(id: string, jsonSchema: JSONSchema={}, uiSchema: Control): SelectionElement {
        // TODO stuff that applies to all sub classes
    }
}


type EnumElementData = z.infer<typeof EnumElement.schema>;
const enumElementDefaults = {type: "enum" as const,format: EnumFormat.Select};
type EnumElementOptionalKeys = keyof typeof enumElementDefaults | SelectionElementOptionalKeys;
export class EnumElement extends SelectionElement {
    data: EnumElementData;

    static schema = SelectionElement.schema.extend({
        type: z.literal("enum"),
        format: z.enum(EnumFormat)
    });

    constructor(
        data: Omit<PartialBy<EnumElementData, EnumElementOptionalKeys>, "type">
    ) {
        super(data);
        this.data = EnumElement.setDefaults(data);
    }

    protected static setDefaults(data: PartialBy<EnumElementData, EnumElementOptionalKeys>): EnumElementData {
        return {
            ...super.setDefaults(data),
            ...enumElementDefaults,
            ...data,
        };
    }

    get format(): EnumFormat {
        return this.data.format;
    }

    toUiSchema(generator: SchemaGenerator, scope: string[]): Control {
        const uiSchema = super.toUiSchema(generator, scope);
        // TODO
    }

    toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema {
        const jsonSchema = super.toJsonSchema(generator, scope);
        // TODO
    }

    static fromJsonSchemaAndUiSchema(id: string, jsonSchema: JSONSchema={}, uiSchema: Control): EnumElement {
        // super.fromJsonSchemaAndUiSchema(id, jsonSchema, uiSchema); ???
        // TODO
    }
}

type CheckboxGroupElementData = z.infer<typeof CheckboxGroupElement.schema>;
const checkboxGroupElementDefaults = {type: "checkbox-group" as const};
type CheckboxGroupElementOptionalKeys = keyof typeof checkboxGroupElementDefaults | SelectionElementOptionalKeys;
export class CheckboxGroupElement extends SelectionElement {
    data: CheckboxGroupElementData;

    static schema = SelectionElement.schema.extend({
        type: z.literal("checkbox-group")
    });

    constructor(
        data: Omit<PartialBy<CheckboxGroupElementData, CheckboxGroupElementOptionalKeys>, "type">
    ) {
        super(data);
        this.data = CheckboxGroupElement.setDefaults(data);
    }

    protected static setDefaults(data: PartialBy<CheckboxGroupElementData, CheckboxGroupElementOptionalKeys>): CheckboxGroupElementData {
        return {
            ...super.setDefaults(data),
            ...checkboxGroupElementDefaults,
            ...data,
        };
    }

    toUiSchema(generator: SchemaGenerator, scope: string[]): Control {
        const uiSchema = super.toUiSchema(generator, scope);
        // TODO
    }

    toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema {
        const jsonSchema = super.toJsonSchema(generator, scope);
        // TODO
    }

    static fromJsonSchemaAndUiSchema(id: string, jsonSchema: JSONSchema={}, uiSchema: Control): CheckboxGroupElement {
        // super.fromJsonSchemaAndUiSchema(id, jsonSchema, uiSchema); ???
        // TODO
    }

}