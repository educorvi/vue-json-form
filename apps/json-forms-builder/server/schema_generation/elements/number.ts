import { z } from "zod";
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { SimpleElement, SimpleElementOptionalKeys } from "./form-element";
import type { SchemaGenerator } from "./schema-generator";
import { PartialBy } from "./base";
import { createShowOnProperty } from "./children-schema-utils";


enum NumberFormat {
    Integer = "integer",
    Number = "number", // float
}


type NumberElementData = z.infer<typeof NumberElement.schema>;
const numberElementDefaults = {type: "number" as const, format: NumberFormat.Integer};
type NumberElementOptionalKeys = keyof typeof numberElementDefaults | SimpleElementOptionalKeys;

export class NumberElement extends SimpleElement {
    data: NumberElementData;

    static schema = SimpleElement.schema.extend({
        type: z.literal("number"),
        format: z.enum(NumberFormat),
        minimum: z.number().optional(),
        maximum: z.number().optional(),
        multipleOf: z.number().optional()
    });

    constructor(
        data: Omit<PartialBy<NumberElementData, NumberElementOptionalKeys>, "type">
    ) {
        super(data);
        this.data = NumberElement.setDefaults(data);
    }

    protected static setDefaults(data: PartialBy<NumberElementData, NumberElementOptionalKeys>): NumberElementData {
        return {
            ...super.setDefaults(data),
            ...numberElementDefaults,
            ...data,
        };
    }

    get format(): NumberFormat {
        return this.data.format;
    }

    get minimum(): number | undefined {
        return this.data.minimum;
    }

    get maximum(): number | undefined {
        return this.data.maximum;
    }

    get multipleOf(): number | undefined {
        return this.data.multipleOf;
    }

    toUiSchema(_generator: SchemaGenerator, _scope: string[]): Control {
        const uiSchema: Control = {
            "type": "Control",
            "scope": _scope.join("/") + "/" + this.id,
        };
        const options = super.getUiSchemaOptions();
        if (Object.keys(options).length > 0) {
            uiSchema.options = options;
        }

        const showOn = createShowOnProperty(this.dependencyGroup, _generator, _scope);
        if (showOn) {
            uiSchema.showOn = showOn;
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

    static fromJsonSchemaAndUiSchema(id: string, jsonSchema: JSONSchema, uiSchema: Control): NumberElement {
        const numberElement = new NumberElement({
            title: jsonSchema.title ? jsonSchema.title : "",
            description: jsonSchema.description,
            id: id
        });
        if ((jsonSchema.type === "number" || jsonSchema.type === "integer") && Object.values(NumberFormat as unknown as string[]).includes(jsonSchema.type)) {
            numberElement.data.format = jsonSchema.type as NumberFormat;
        } else {
            throw new Error("Invalid type for NumberElement: " + jsonSchema.type);
        }
        numberElement.data.minimum = jsonSchema.minimum;
        numberElement.data.maximum = jsonSchema.maximum;
        numberElement.data.multipleOf = jsonSchema.multipleOf;
        return numberElement;
    }

}
