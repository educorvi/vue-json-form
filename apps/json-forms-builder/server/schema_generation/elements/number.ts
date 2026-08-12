import { z } from "zod";
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { SimpleElement, SimpleElementOptionalKeys } from "./form-element";
import type { SchemaGenerator } from "./schema-generator";
import { PartialBy } from "./base";


enum NumberFormat {
    Integer = "integer",
    Number = "number", // float
}


type NumberElementData = z.infer<typeof NumberElement.schema>;
const numberElementDefaults = {type: "number" as const, format: NumberFormat.Integer, range: false};
type NumberElementOptionalKeys = keyof typeof numberElementDefaults | SimpleElementOptionalKeys;

export class NumberElement extends SimpleElement {
    data: NumberElementData;

    static schema = SimpleElement.schema.extend({
        type: z.literal("number"),
        format: z.enum(NumberFormat),
        minimum: z.number().optional(),
        maximum: z.number().optional(),
        multipleOf: z.number().optional(),
        range: z.boolean()
    }).superRefine((data, ctx) => {
        if (data.minimum !== undefined && data.maximum !== undefined && data.minimum > data.maximum) {
            ctx.addIssue({
                code: "custom",
                message: "minimum cannot be greater than maximum",
                value: data,
            });
        }
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

    get range(): boolean {
        return this.data.range;
    }

    toUiSchema(_generator: SchemaGenerator, _scope: string[]): Control {
        const uiSchema = super.toUiSchema(_generator, _scope);
        uiSchema.options = {
            ...uiSchema.options,
            ...(this.range && { range: this.range }),
        };

        return uiSchema;
    }

    toJsonSchema(_generator: SchemaGenerator, _scope: string[]): JSONSchema {
        const schema: JSONSchema = {
            ...super.toJsonSchema(_generator, _scope),
            "type": this.format,
            ...(this.minimum !== undefined && { minimum: this.minimum }),
            ...(this.maximum !== undefined && { maximum: this.maximum }),
            ...(this.multipleOf !== undefined && { multipleOf: this.multipleOf }),
        };
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
