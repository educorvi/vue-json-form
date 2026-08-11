import { z } from "zod";
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { SimpleElement, SimpleElementOptionalKeys } from "./form-element";
import type { SchemaGenerator } from "./schema-generator";
import { PartialBy } from "./base";
import { createShowOnProperty } from "./children-schema-utils";
import controlSchema from "@educorvi/vue-json-form-schemas/src/ui/control.schema.json";
import type { InputOptions } from "@educorvi/vue-json-form-schemas";

type FormatValue = NonNullable<InputOptions["format"]>;
const StringFormatEnum = z.enum(
  controlSchema.definitions.inputOptions.properties.format.enum as [FormatValue, ...FormatValue[]]
);
export type StringFormat = z.infer<typeof StringFormatEnum>;

type StringElementData = z.infer<typeof StringElement.schema>;
const stringElementDefaults = {type: "string" as const, format: "text" as const};
type StringElementOptionalKeys = keyof typeof stringElementDefaults | SimpleElementOptionalKeys;
export class StringElement extends SimpleElement {
    data: StringElementData;

    static schema = SimpleElement.schema.extend({
        type: z.literal("string"),
        format: StringFormatEnum,
        multi: z.boolean().or(z.number()).optional(),
        minLength: z.number().int().nonnegative().optional(),
        maxLength: z.number().int().nonnegative().optional(),
        placeholder: z.string().optional(),
        pattern: z.string().optional()
    });

    constructor(
        data: Omit<PartialBy<StringElementData, StringElementOptionalKeys>, "type">
    ) {
        super(data);
        this.data = StringElement.setDefaults(data);
    }

    get format(): StringFormat {
        return this.data.format;
    }

    get multi(): boolean | number | undefined {
        return this.data.multi;
    }

    get minLength(): number | undefined {
        return this.data.minLength;
    }

    get maxLength(): number | undefined {
        return this.data.maxLength;
    }

    get placeholder(): string | undefined {
        return this.data.placeholder;
    }

    get pattern(): string | undefined {
        return this.data.pattern;
    }

    protected static setDefaults(data: PartialBy<StringElementData, StringElementOptionalKeys>): StringElementData {
        return {
            ...super.setDefaults(data),
            ...stringElementDefaults,
            ...data,
        };
    }

    toUiSchema(_generator: SchemaGenerator, _scope: string[]): Control {
        const uiSchema = super.toUiSchema(_generator, _scope);
        uiSchema.options = {
            ...uiSchema.options,
            ...(this.placeholder && { placeholder: this.placeholder }),
            ...(this.format && { format: this.format }),
            ...(this.multi && { multi: this.multi }),
        };

        const showOn = createShowOnProperty(this.dependencyGroup, _generator, _scope);
        if (showOn) {
            uiSchema.showOn = showOn;
        }

        return uiSchema;
    }

    toJsonSchema(_generator: SchemaGenerator, _scope: string[]): JSONSchema {
        const schema: JSONSchema = {
            ...super.toJsonSchema(_generator, _scope),
            type: "string",
            ...(this.minLength && { minLength: this.minLength }),
            ...(this.maxLength && { maxLength: this.maxLength }),
            ...(this.pattern && { pattern: this.pattern }),
        };

        return schema;
    }

    static fromJsonSchemaAndUiSchema(id: string, jsonSchema: JSONSchema, uiSchema: any): StringElement {
        if (jsonSchema.type === "string") {
            const stringElement = new StringElement(
                {
                    "title": jsonSchema.title ? jsonSchema.title : "",
                    "description": jsonSchema.description,
                    "id": id
                }
            );
            if (jsonSchema.format && Object.values(StringFormat as unknown as string[]).includes(jsonSchema.format)) {
                stringElement.data.format = jsonSchema.format;
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
