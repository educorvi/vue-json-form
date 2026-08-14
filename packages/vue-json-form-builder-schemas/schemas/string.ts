import { z } from 'zod';
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { SimpleElement, SimpleElementOptionalKeys } from './form-element';
import type { SchemaGenerator } from './schema-generator';
import { PartialBy } from './base';
import { cleanUiSchema } from './utils';

/**
 * Formats for string elements. Values mirror the `inputOptions.format` enum
 * of control.schema.json in @educorvi/vue-json-form-schemas — minus the
 * formats that have their own element class (color → ColorElement,
 * time/date/datetime-local → TimeElement).
 */
export enum StringFormat {
    Text = 'text',
    Email = 'email',
    Password = 'password',
    Search = 'search',
    Uri = 'url',
    Tel = 'tel',
    Hidden = 'hidden',
}

const StringFormatEnum = z.enum(StringFormat);

type StringElementData = z.infer<typeof StringElement.schema>;
const stringElementDefaults = {
    type: 'string' as const,
    format: StringFormat.Text,
};
type StringElementOptionalKeys =
    keyof typeof stringElementDefaults | SimpleElementOptionalKeys;
export class StringElement extends SimpleElement {
    data: StringElementData;

    static schema = SimpleElement.schema
        .extend({
            type: z.literal('string'),
            format: StringFormatEnum,
            multi: z.boolean().or(z.number()).optional(),
            minLength: z.number().int().nonnegative().optional(),
            maxLength: z.number().int().nonnegative().optional(),
            placeholder: z.string().optional(),
            pattern: z.string().optional(),
        })
        .superRefine((data, ctx) => {
            if (
                data.minLength !== undefined &&
                data.maxLength !== undefined &&
                data.minLength > data.maxLength
            ) {
                ctx.addIssue({
                    code: 'custom',
                    message: 'minLength cannot be greater than maxLength',
                    value: data,
                });
            }
        });

    constructor(
        data: Omit<
            PartialBy<StringElementData, StringElementOptionalKeys>,
            'type'
        >
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

    protected static setDefaults(
        data: PartialBy<StringElementData, StringElementOptionalKeys>
    ): StringElementData {
        return {
            ...super.setDefaults(data),
            ...stringElementDefaults,
            ...data,
        };
    }

    toUiSchema(_generator: SchemaGenerator, _scope: string[]): Control {
        const uiSchema = super.toUiSchema(_generator, _scope);
        uiSchema.options = {
            ...(uiSchema.options && { ...uiSchema.options }),
            ...(this.placeholder && { placeholder: this.placeholder }),
            ...(this.format && { format: this.format }),
            ...(this.multi && { multi: this.multi }),
        };
        cleanUiSchema(uiSchema);
        return uiSchema;
    }

    toJsonSchema(_generator: SchemaGenerator, _scope: string[]): JSONSchema {
        const jsonSchemaFormatMap: Record<string, string> = {
            email: 'email',
        };
        const jsonSchema: JSONSchema = {
            ...super.toJsonSchema(_generator, _scope),
            type: 'string',
            ...(this.minLength !== undefined && { minLength: this.minLength }),
            ...(this.maxLength !== undefined && { maxLength: this.maxLength }),
            ...(this.pattern && { pattern: this.pattern }),
            ...(this.format && jsonSchemaFormatMap[this.format]
                ? { format: jsonSchemaFormatMap[this.format] }
                : undefined),
        };
        return jsonSchema;
    }

    static fromJsonSchemaAndUiSchema(
        id: string,
        jsonSchema: JSONSchema,
        uiSchema: any,
        required: boolean = false
    ): StringElement {
        if (jsonSchema.type === 'string') {
            const stringElement = new StringElement({
                title: jsonSchema.title ? jsonSchema.title : '',
                description: jsonSchema.description,
                id: id,
                required: required,
            });
            if (jsonSchema.format === undefined) {
                stringElement.data.format = StringFormat.Text; // most schemas have no format
            } else if (
                Object.values(StringFormat as unknown as string[]).includes(
                    jsonSchema.format
                )
            ) {
                stringElement.data.format = jsonSchema.format as StringFormat;
            } else {
                throw new Error(
                    'Invalid format for StringElement: ' + jsonSchema.format
                );
            }
            stringElement.data.minLength = jsonSchema.minLength;
            stringElement.data.maxLength = jsonSchema.maxLength;
            stringElement.data.pattern = jsonSchema.pattern;
            stringElement.data.placeholder = uiSchema.options?.placeholder;
            return stringElement;
        } else {
            throw new Error(
                'Invalid type for StringElement: ' + jsonSchema.type
            );
        }
    }
}
