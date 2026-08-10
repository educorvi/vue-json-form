import { z } from "zod";
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { SimpleElement, SimpleElementOptionalKeys } from "./form-element";
import { DependencyGroup } from "./dependency";
import type { SchemaGenerator } from "./schema-generator";
import { Entity, PartialBy } from "./base";


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
const stringElementDefaults = {type: "string" as const, format: StringFormat.Text};
type StringElementOptionalKeys = keyof typeof stringElementDefaults | SimpleElementOptionalKeys;
export class StringElement extends SimpleElement {
    data: StringElementData;

    static schema = SimpleElement.schema.extend({
        type: z.literal("string"),
        format: z.enum(StringFormat),
        minLength: z.number().int().nonnegative().optional(),
        maxLength: z.number().int().nonnegative().optional(),
        placeholder: z.string().optional()
    });

    constructor(
        data: Omit<PartialBy<StringElementData, StringElementOptionalKeys>, "type">
    ) {
        super(data);
        this.data = StringElement.setDefaults(data);
    }

    protected static setDefaults(data: PartialBy<StringElementData, StringElementOptionalKeys>): StringElementData {
        return {
            ...super.setDefaults(data),
            ...stringElementDefaults,
            ...data,
        };
    }

    toUiSchema(_generator: SchemaGenerator, _scope: string[]): Control {
        const uiSchema: Control = {
            "type": "Control",
            "scope": _scope.join("/") + "/" + this.id,
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

    static fromJsonSchemaAndUiSchema(id: string, jsonSchema: JSONSchema, uiSchema: any): StringElement {
        if (jsonSchema.type === "string") {
            const stringElement = new StringElement({"title": jsonSchema.title ? jsonSchema.title : "", "description": jsonSchema.description, "id": id});
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
