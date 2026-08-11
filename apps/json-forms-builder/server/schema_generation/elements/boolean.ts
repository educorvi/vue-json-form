import { z } from "zod";
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { SimpleElement, SimpleElementOptionalKeys } from "./form-element";
import type { SchemaGenerator } from "./schema-generator";
import { PartialBy } from "./base";
import { createShowOnProperty } from "./children-schema-utils";


enum BooleanFormat {
    Checkbox = "checkbox",
    Switch = "switch"
}


type BooleanElementData = z.infer<typeof BooleanElement.schema>;
const booleanElementDefaults = {type: "boolean" as const, format: BooleanFormat.Checkbox, mustBeTrue: false};
type BooleanElementOptionalKeys = keyof typeof booleanElementDefaults | SimpleElementOptionalKeys;

export class BooleanElement extends SimpleElement {
    data: BooleanElementData;

    static schema = SimpleElement.schema.extend({
        type: z.literal("boolean"),
        format: z.enum(BooleanFormat),
        mustBeTrue: z.boolean()
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

    get format(): BooleanFormat {
        return this.data.format;
    }

    get mustBeTrue(): boolean {
        return this.data.mustBeTrue;
    }

    toUiSchema(_generator: SchemaGenerator, scope: string[]): Control {
        // TODO
    }

    toJsonSchema(_generator: SchemaGenerator, scope: string[]): JSONSchema {
        // TODO
    }

    static fromJsonSchemaAndUiSchema(id: string, jsonSchema: JSONSchema={}, uiSchema: Control): BooleanElement {
        // TODO
    }

}