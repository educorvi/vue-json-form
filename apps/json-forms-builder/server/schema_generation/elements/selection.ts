import { z } from "zod";
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { SimpleElement, SimpleElementOptionalKeys } from "./form-element";
import type { SchemaGenerator } from "./schema-generator";
import { PartialBy } from "./base";
import controlSchema from "@educorvi/vue-json-form-schemas/src/ui/control.schema.json";
import type { EnumOptions } from "@educorvi/vue-json-form-schemas";
import { ButtonVariantFormatEnum, ButtonVariantFormat } from "../utils";


type SelectionElementData = z.infer<typeof SelectionElement.schema>;
const selectionElementDefaults = {enumTitles: false, values: [] as string[], stacked: false};
type SelectionElementOptionalKeys = keyof typeof selectionElementDefaults | SimpleElementOptionalKeys;

export abstract class SelectionElement extends SimpleElement {
    data: SelectionElementData;

    static schema = SimpleElement.schema.extend({
        values: z.array(z.string()), // for select and radio, the options are the possible values; for checkbox group, the options are the labels of the checkboxes
        stacked: z.boolean(),
        enumTitles: z.boolean(), // TODO not a boolean
        optionFilters: z.object({}).optional(), // TODO change, adapt in ui schema
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

    get values(): string[] {
        return this.data.values;
    }

    get stacked(): boolean {
        return this.data.stacked;
    }

    get enumTitles(): boolean {
        return this.data.enumTitles;
    }

    get optionFilters(): Record<string, any> | undefined {
        return this.data.optionFilters;
    }

    toUiSchema(generator: SchemaGenerator, scope: string[]): Control {
        const uiSchema = super.toUiSchema(generator, scope);
        uiSchema.options = {
            ...(uiSchema.options && { ...uiSchema.options }),
            ...(this.stacked && { stacked: this.stacked }),
            // enumTitles: this.enumTitles, // TODO enumTitles = {id: title, id: title, ...}
            // optionFilters: this.optionFilters, // TODO
        };

        return uiSchema;
    }

    toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema {
        return super.toJsonSchema(generator, scope);
    }

    fromJsonSchemaAndUiSchema(id: string, jsonSchema: JSONSchema={}, uiSchema: Control): SelectionElement {
        // TODO stuff that applies to all sub classes
    }
}


type FormatValue = NonNullable<EnumOptions["displayAs"]>;
const EnumFormatEnum = z.enum(
  controlSchema.definitions.enumOptions.allOf[0]!.properties.displayAs.enum as [FormatValue, ...FormatValue[]]
);
export type EnumFormat = z.infer<typeof EnumFormatEnum>;

type EnumElementData = z.infer<typeof EnumElement.schema>;
const enumElementDefaults = {type: "enum" as const, format: "select" as const};
type EnumElementOptionalKeys = keyof typeof enumElementDefaults | SelectionElementOptionalKeys;
export class EnumElement extends SelectionElement {
    data: EnumElementData;

    static schema = SelectionElement.schema.extend({
        type: z.literal("enum"),
        format: EnumFormatEnum, // = displayAs in the ui schema
        buttonVariant: ButtonVariantFormatEnum.optional() // only applicable if format is set to 'buttons'
    }).superRefine((data, ctx) => {
        if (data.buttonVariant !== undefined && data.format !== "buttons") {
            ctx.addIssue({
                code: "custom",
                message: "buttonVariant can only be set if format is 'buttons'",
                input: data,
            });
        }
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

    get buttonVariant(): ButtonVariantFormat | undefined {
        return this.data.buttonVariant;
    }

    toUiSchema(generator: SchemaGenerator, scope: string[]): Control {
        const uiSchema = super.toUiSchema(generator, scope);
        uiSchema.options = {
            ...(uiSchema.options && { ...uiSchema.options }),
            ...(this.format && { displayAs: this.format }),
            ...(this.buttonVariant && { buttonVariant: this.buttonVariant }),
        };

        return uiSchema;
    }

    toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema {
        const jsonSchema = {
            ...super.toJsonSchema(generator, scope),
            type: "string",
            enum: this.values,
        };
        return jsonSchema;
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
        type: z.literal("checkbox-group"),
        minItems: z.number().int().nonnegative().optional(),
        maxItems: z.number().int().nonnegative().optional()
    }).superRefine((data, ctx) => {
        if (data.minItems !== undefined && data.maxItems !== undefined && data.minItems > data.maxItems) {
            ctx.addIssue({
                code: "custom",
                message: "minItems cannot be greater than maxItems",
                input: data,
            });
        }
    });

    constructor(
        data: Omit<PartialBy<CheckboxGroupElementData, CheckboxGroupElementOptionalKeys>, "type">
    ) {
        super(data);
        this.data = CheckboxGroupElement.setDefaults(data);
    }

    get minItems(): number | undefined {
        return this.data.minItems;
    }

    get maxItems(): number | undefined {
        return this.data.maxItems;
    }

    protected static setDefaults(data: PartialBy<CheckboxGroupElementData, CheckboxGroupElementOptionalKeys>): CheckboxGroupElementData {
        return {
            ...super.setDefaults(data),
            ...checkboxGroupElementDefaults,
            ...data,
        };
    }

    toUiSchema(generator: SchemaGenerator, scope: string[]): Control {
        return super.toUiSchema(generator, scope);
    }

    toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema {
        const jsonSchema = {
            ...super.toJsonSchema(generator, scope),
            type: "array",
            items: {
                type: "string",
                enum: this.values,
            },
            ...(this.minItems !== undefined && { minItems: this.minItems }),
            ...(this.maxItems !== undefined && { maxItems: this.maxItems }),
        };

        if (this.required) {
            jsonSchema.minItems = Math.max(1, this.minItems ?? 0);
        }

        return jsonSchema;
    }

    static fromJsonSchemaAndUiSchema(id: string, jsonSchema: JSONSchema={}, uiSchema: Control): CheckboxGroupElement {
        // super.fromJsonSchemaAndUiSchema(id, jsonSchema, uiSchema); ???
        // TODO
    }

}