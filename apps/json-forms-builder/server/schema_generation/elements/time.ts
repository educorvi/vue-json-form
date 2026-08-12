import { z } from "zod";
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { SimpleElement, SimpleElementOptionalKeys } from "./form-element";
import type { SchemaGenerator } from "./schema-generator";
import { PartialBy } from "./base";
import controlSchema from "@educorvi/vue-json-form-schemas/src/ui/control.schema.json";
import type { InputOptions } from "@educorvi/vue-json-form-schemas";


export enum TimeFormat {
    Time = "time",
    Date = "date",
    DateTimeLocal = "datetime-local"
}

type TimeElementData = z.infer<typeof TimeElement.schema>;
const timeElementDefaults = {type: "string" as const, format: TimeFormat.Time as const};
type TimeElementOptionalKeys = keyof typeof timeElementDefaults | SimpleElementOptionalKeys;

export class TimeElement extends SimpleElement {
    data: TimeElementData;

    static schema = SimpleElement.schema.extend({
        type: z.literal("string"),
        format: z.enum(TimeFormat),
    });

    constructor(
        data: Omit<PartialBy<TimeElementData, TimeElementOptionalKeys>, "type">
    ) {
        super(data);
        this.data = TimeElement.setDefaults(data);
    }

    get format(): TimeFormat {
        return this.data.format;
    }

    protected static setDefaults(data: PartialBy<TimeElementData, TimeElementOptionalKeys>): TimeElementData {
        return {
            ...super.setDefaults(data),
            ...timeElementDefaults,
            ...data,
        };
    }

    toUiSchema(_generator: SchemaGenerator, _scope: string[]): Control {
        const uiSchema = super.toUiSchema(_generator, _scope);
        uiSchema.options = {
            ...(uiSchema.options && { ...uiSchema.options }),
            ...(this.format && { format: this.format }),
        };

        return uiSchema;
    }

    toJsonSchema(_generator: SchemaGenerator, _scope: string[]): JSONSchema {
        const jsonSchemaFormatMap = {
            [TimeFormat.Time]: "time",
            [TimeFormat.Date]: "date",
            [TimeFormat.DateTimeLocal]: "date-time"
        };
        const jsonSchema: JSONSchema = {
            ...super.toJsonSchema(_generator, _scope),
            type: "string",
            format: jsonSchemaFormatMap[this.format],
        };

        return jsonSchema;
    }

    static fromJsonSchemaAndUiSchema(id: string, jsonSchema: JSONSchema, uiSchema: any): TimeElement {
        if (!(jsonSchema.type === "string")) {
            throw new Error("Invalid type for TimeElement: " + jsonSchema.type);
        }
        const timeElement = new TimeElement(
            {
                "title": jsonSchema.title ? jsonSchema.title : "",
                "description": jsonSchema.description,
                "id": id
            }
        );
        //TODO
        return timeElement;
    }
}
