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


type StringElementData = z.infer<typeof StringElement.schema>;
export class StringElement extends SimpleElement {
    data: StringElementData;

    // more attributes
    static schema = SimpleElement.schema.extend({
        type: z.literal("string"),
        format: z.enum(StringFormat),
        minLength: z.number().int().nonnegative().optional(),
        maxLength: z.number().int().nonnegative().optional(),
        placeholder: z.string().optional()
    });

    constructor(
        data: Partial<StringElementData> & Omit<StringElementData, "format">,
    ) {
        super(data);
        this.data = {
            ...data,
            format: data.format ?? StringFormat.Text
        }
    }

    toUiSchema(_generator: SchemaGenerator, _scope: string[]): Control {
        const uiSchema: Control = {
            "type": "Control",
            "scope": _scope.join("/") + "/" + this.getID(),
        };
        const options = super.getUiSchemaOptions();
        if (this.data.placeholder) {
            options["placeholder"] = this.data.placeholder;
        }
        if (Object.keys(options).length > 0) {
            uiSchema.options = options;
        }

        if (this.data.dependencyGroup) {
            uiSchema.showOn = this.data.dependencyGroup.toUiSchema(_generator, _scope);
        }
        return uiSchema;
    }

    toJsonSchema(_generator: SchemaGenerator, _scope: string[]): JSONSchema {
        let schema: any = {
            "type": "string",
            "title": this.data.title,
        };
        if (this.data.description !== undefined) {
            schema.description = this.data.description;
        }
        if (this.data.format !== undefined) {
            schema.format = this.data.format;
        }
        if (this.data.minLength !== undefined) {
            schema.minLength = this.data.minLength;
        }
        if (this.data.maxLength !== undefined) {
            schema.maxLength = this.data.maxLength;
        }

        return schema;
    }

    static fromJsonSchemaAndUiSchema(jsonSchema: JSONSchema, uiSchema: any): StringElement {
        if (jsonSchema.type === "string") {
            const stringElement = new StringElement({"title": jsonSchema.title ? jsonSchema.title : "", "description": jsonSchema.description});
            if (jsonSchema.format && Object.values(StringFormat as unknown as string[]).includes(jsonSchema.format)) {
                stringElement.data.format = jsonSchema.format as StringFormat;
            } else {
                throw new Error("Invalid format for StringElement: " + jsonSchema.format);
            }
            stringElement.data.minLength = jsonSchema.minLength;
            stringElement.data.maxLength = jsonSchema.maxLength;
            stringElement.data.placeholder = uiSchema.options?.placeholder;
            return stringElement;
        } else {
            throw new Error("Invalid type for StringElement: " + jsonSchema.type);
        }
    }
}
