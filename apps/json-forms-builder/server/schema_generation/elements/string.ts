import { z } from "zod";
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { SimpleElement, DependencyGroup } from "../base";


enum StringFormats {
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

    format!: StringFormats;

    // more attributes
    static schema = SimpleElement.schema.extend({
        type: z.literal("string"),
        format: z.enum(StringFormats)
    });

    constructor(title: string, description?: string, format: StringFormats = StringFormats.Text, required: boolean = false, dependencyGroup?: DependencyGroup, id?: string) {
        super(title, description, required, dependencyGroup, id);
        this.format = format;
    }

    toUiSchema(scope: string): Control {
        return {
            "type": "Control",
            "scope": scope + "/properties/" + this.getID(),
            "options": {
                // possible options from attributes
            }
        };
    }

    toJsonSchema(): JSONSchema {
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
        return schema;
    }

    static fromJsonSchemaAndUiSchema(jsonSchema: JSONSchema, uiSchema: any): StringElement {
        if (jsonSchema.type === "string") {
            let stringElement = new StringElement(jsonSchema.title ? jsonSchema.title : "", jsonSchema.description);
            if (jsonSchema.format && Object.values(StringFormats as unknown as string[]).includes(jsonSchema.format)) {
                stringElement.format = jsonSchema.format as StringFormats;
            } else {
                throw new Error("Invalid format for StringElement: " + jsonSchema.format);
            }
            return stringElement;
        } else {
            throw new Error("Invalid type for StringElement: " + jsonSchema.type);
        }
    }
}
