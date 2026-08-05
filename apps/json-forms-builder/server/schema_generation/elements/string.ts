import { z } from "zod";
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { SimpleElement } from "./form-element";
import { DependencyGroup } from "./dependency";
import type { SchemaGenerator } from "./schema-generator";


export enum StringFormat {
    Text = "text",
    TextArea = "text-area",
    Email = "email",
    Password = "password",
    Date = "date",
    DateTime = "date-time",
    Time = "time",
    Uri = "uri",
    Phone = "phone",
    Color = "color",
    Search = "search",
}


export class StringElement extends SimpleElement {
    readonly type = "string";
    format!: StringFormat;
    minLength?: number;
    maxLength?: number;
    placeholder?: string;

    // more attributes
    static schema = SimpleElement.schema.extend({
        type: z.literal("string"),
        format: z.enum(StringFormat),
        minLength: z.number().int().nonnegative().optional(),
        maxLength: z.number().int().nonnegative().optional(),
        placeholder: z.string().optional()
    });

    constructor(
        title: string,
        description?: string,
        format: StringFormat = StringFormat.Text,
        required: boolean = false,
        dependencyGroup?: DependencyGroup,
        id?: string,
        tooltip?: string,
        hidden: boolean = false,
        preHtml?: string,
        postHtml?: string,
        appendValue?: string,
        prependValue?: string,
        pattern?: string
    ) {
        super(title, description, required, dependencyGroup, id, tooltip, hidden, preHtml, postHtml, appendValue, prependValue, pattern);
        this.format = format;
    }

    toUiSchema(_generator: SchemaGenerator, _scope: string[]): Control {
        const uiSchema: Control = {
            "type": "Control",
            "scope": _scope.join("/") + "/" + this.getID(),
        };
        const options = super.getUiSchemaOptions();
        if (this.placeholder) {
            options["placeholder"] = this.placeholder;
        }
        if (Object.keys(options).length > 0) {
            uiSchema.options = options;
        }

        if (this.dependencyGroup) {
            uiSchema.showOn = this.dependencyGroup.toUiSchema(_generator, _scope);
        }
        return uiSchema;
    }

    toJsonSchema(_generator: SchemaGenerator, _scope: string[]): JSONSchema {
        let schema: any = {
            "type": "string",
            "title": this.title,
        };
        if (this.description !== undefined) {
            schema.description = this.description;
        }
        if (this.format !== undefined) {
            schema.format = this.format;
        }
        if (this.minLength !== undefined) {
            schema.minLength = this.minLength;
        }
        if (this.maxLength !== undefined) {
            schema.maxLength = this.maxLength;
        }

        return schema;
    }

    static fromJsonSchemaAndUiSchema(jsonSchema: JSONSchema, uiSchema: any): StringElement {
        if (jsonSchema.type === "string") {
            const stringElement = new StringElement(jsonSchema.title ? jsonSchema.title : "", jsonSchema.description);
            if (jsonSchema.format && Object.values(StringFormat as unknown as string[]).includes(jsonSchema.format)) {
                stringElement.format = jsonSchema.format as StringFormat;
            } else {
                throw new Error("Invalid format for StringElement: " + jsonSchema.format);
            }
            stringElement.minLength = jsonSchema.minLength;
            stringElement.maxLength = jsonSchema.maxLength;
            stringElement.placeholder = uiSchema.options?.placeholder;
            return stringElement;
        } else {
            throw new Error("Invalid type for StringElement: " + jsonSchema.type);
        }
    }
}
