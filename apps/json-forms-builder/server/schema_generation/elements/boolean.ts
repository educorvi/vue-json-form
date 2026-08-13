import { z } from "zod";
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { SimpleElement, SimpleElementOptionalKeys } from "./form-element";
import type { SchemaGenerator } from "./schema-generator";
import { PartialBy } from "./base";
import { cleanUiSchema } from "../utils";


// enum BooleanFormat {
//     Checkbox = "checkbox",
//     Switch = "switch"
// }


type BooleanElementData = z.infer<typeof BooleanElement.schema>;
const booleanElementDefaults = {type: "boolean" as const}; //, format: BooleanFormat.Checkbox};
type BooleanElementOptionalKeys = keyof typeof booleanElementDefaults | SimpleElementOptionalKeys;

export class BooleanElement extends SimpleElement {
    data: BooleanElementData;

    static schema = SimpleElement.schema.extend({
        type: z.literal("boolean"),
        // format: z.enum(BooleanFormat),
    });

    constructor(
        data: Omit<PartialBy<BooleanElementData, BooleanElementOptionalKeys>, "type">
    ) {
        super(data);
        this.data = BooleanElement.setDefaults(data);
    }

    protected static setDefaults(data: PartialBy<BooleanElementData, BooleanElementOptionalKeys>): BooleanElementData {
        return {
            ...super.setDefaults(data),
            ...booleanElementDefaults,
            ...data,
        };
    }

    // get format(): BooleanFormat {
    //     return this.data.format;
    // }

    toUiSchema(_generator: SchemaGenerator, scope: string[]): Control {
        const uiSchema = super.toUiSchema(_generator, scope);
        // uiSchema.options = {
        //     ...uiSchema.options,
        //     format: this.format, TODO
        // };

        cleanUiSchema(uiSchema);

        return uiSchema;
    }

    toJsonSchema(_generator: SchemaGenerator, scope: string[]): JSONSchema {
        const jsonSchema = {
            ...super.toJsonSchema(_generator, scope),
            type: "boolean",
        }
        if (this.required) {
            jsonSchema.const = true;
        }
        return jsonSchema;
    }

    static fromJsonSchemaAndUiSchema(id: string, jsonSchema: JSONSchema={}, uiSchema: Control): BooleanElement {
        // TODO
    }

}