import { z } from "zod";
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { SimpleElement, DependencyGroup } from "../base";


enum NumberFormats {
    Integer = "integer",
    Number = "number", // float
}


export class NumberElement extends SimpleElement {
    readonly type = "number";

    format!: NumberFormats;

    minimum?: number;

    maximum?: number;

    multipleOf?: number;

    static schema = SimpleElement.schema.extend({
        type: z.literal("number"),
        format: z.enum(NumberFormats),
        minimum: z.number().optional(),
        maximum: z.number().optional(),
        multipleOf: z.number().optional()
    });

    constructor(title: string, description?: string, format: NumberFormats = NumberFormats.Number, required: boolean = false, dependencyGroup?: DependencyGroup, id?: string) {
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
        let schema: JSONSchema = {
            "type": this.format,
            "title": this.title,
        };
        if (this.description !== undefined) {
            schema.description = this.description;
        }
        if (this.minimum !== undefined) {
            schema.minimum = this.minimum;
        }
        if (this.maximum !== undefined) {
            schema.maximum = this.maximum;
        }
        if (this.multipleOf !== undefined) {
            schema.multipleOf = this.multipleOf;
        }
        return schema;
    }

    static fromJsonSchemaAndUiSchema(jsonSchema: JSONSchema, uiSchema: Control): NumberElement {
        let numberElement = new NumberElement(jsonSchema.title ? jsonSchema.title : "", jsonSchema.description);
        if ((jsonSchema.type === "number" || jsonSchema.type === "integer") && Object.values(NumberFormats as unknown as string[]).includes(jsonSchema.type)) {
            numberElement.format = jsonSchema.type as NumberFormats;
        } else {
            throw new Error("Invalid type for NumberElement: " + jsonSchema.type);
        }
        numberElement.minimum = jsonSchema.minimum;
        numberElement.maximum = jsonSchema.maximum;
        numberElement.multipleOf = jsonSchema.multipleOf;
        return numberElement;
    }

}
