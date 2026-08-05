import { z } from "zod";
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { SimpleElement } from "./form-element";
import type { DependencyGroup } from "./dependency";
import type { SchemaGenerator } from "./schema-generator";


enum NumberFormat {
    Integer = "integer",
    Number = "number", // float
}


export class NumberElement extends SimpleElement {
    readonly type = "number";

    format!: NumberFormat;
    minimum?: number;
    maximum?: number;
    multipleOf?: number;

    static schema = SimpleElement.schema.extend({
        type: z.literal("number"),
        format: z.enum(NumberFormat),
        minimum: z.number().optional(),
        maximum: z.number().optional(),
        multipleOf: z.number().optional()
    });

    constructor(
        title: string,
        description?: string,
        format: NumberFormat = NumberFormat.Number,
        required: boolean = false,
        dependencyGroup?: DependencyGroup,
        id?: string,
        tooltip?: string,
        hidden: boolean = false,
        preHtml?: string,
        postHtml?: string,
        prependValue?: string,
        appendValue?: string,
        pattern?: string
    ) {
        super(title, description, required, dependencyGroup, id, tooltip, hidden, preHtml, postHtml, prependValue, appendValue, pattern);
        this.format = format;
    }

    toUiSchema(_generator: SchemaGenerator, _scope: string[]): Control {
        const uiSchema: Control = {
            "type": "Control",
            "scope": _scope.join("/") + "/" + this.getID(),
        };
        const options = super.getUiSchemaOptions();
        if (Object.keys(options).length > 0) {
            uiSchema.options = options;
        }

        if (this.dependencyGroup) {
            uiSchema.showOn = this.dependencyGroup.toUiSchema(_generator, _scope);
        }
        return uiSchema;
    }

    toJsonSchema(_generator: SchemaGenerator, _scope: string[]): JSONSchema {
        const schema: JSONSchema = {
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
        const numberElement = new NumberElement(jsonSchema.title ? jsonSchema.title : "", jsonSchema.description);
        if ((jsonSchema.type === "number" || jsonSchema.type === "integer") && Object.values(NumberFormat as unknown as string[]).includes(jsonSchema.type)) {
            numberElement.format = jsonSchema.type as NumberFormat;
        } else {
            throw new Error("Invalid type for NumberElement: " + jsonSchema.type);
        }
        numberElement.minimum = jsonSchema.minimum;
        numberElement.maximum = jsonSchema.maximum;
        numberElement.multipleOf = jsonSchema.multipleOf;
        return numberElement;
    }

}
