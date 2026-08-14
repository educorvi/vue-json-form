import { z } from 'zod';
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { SimpleElement, SimpleElementOptionalKeys } from './form-element';
import type { SchemaGenerator } from './schema-generator';
import { PartialBy } from './base';
import { cleanUiSchema } from './utils';

type ColorElementData = z.infer<typeof ColorElement.schema>;
const colorElementDefaults = { type: 'string' as const, format: 'color' as const };
type ColorElementOptionalKeys =
    keyof typeof colorElementDefaults | SimpleElementOptionalKeys;
export class ColorElement extends SimpleElement {
    data: ColorElementData;

    static schema = SimpleElement.schema.extend({
        type: z.literal('string'),
        format: z.literal('color'),
    });

    constructor(
        data: Omit<
            PartialBy<ColorElementData, ColorElementOptionalKeys>,
            'type'
        >
    ) {
        super(data);
        this.data = ColorElement.setDefaults(data);
    }

    get format(): 'color' {
        return this.data.format;
    }

    protected static setDefaults(
        data: PartialBy<ColorElementData, ColorElementOptionalKeys>
    ): ColorElementData {
        return {
            ...super.setDefaults(data),
            ...colorElementDefaults,
            ...data,
        };
    }

    toUiSchema(
        _generator: SchemaGenerator,
        _scope: string[]
    ): Control {
        const uiSchema = super.toUiSchema(_generator, _scope);
        uiSchema.options = {
            ...(uiSchema.options && { ...uiSchema.options }),
            ...(this.format && { format: this.format }),
        };

        cleanUiSchema(uiSchema);

        return uiSchema;
    }

    toJsonSchema(
        _generator: SchemaGenerator,
        _scope: string[]
    ): JSONSchema {
        const jsonSchema: JSONSchema = {
            ...super.toJsonSchema(_generator, _scope),
            type: 'string',
        };
        return jsonSchema;
    }

    static fromJsonSchemaAndUiSchema(
        id: string,
        jsonSchema: JSONSchema,
        _uiSchema: any,
        required: boolean = false
    ): ColorElement {
        if (jsonSchema.type !== 'string') {
            throw new Error(
                'Invalid type for ColorElement: ' + jsonSchema.type
            );
        }
        return new ColorElement({
            title: jsonSchema.title ? jsonSchema.title : '',
            description: jsonSchema.description,
            id: id,
            required: required,
        });
    }
}
