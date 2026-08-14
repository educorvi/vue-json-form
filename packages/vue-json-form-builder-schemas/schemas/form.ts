import { Entity } from './base';
import { z } from 'zod';
import type { PartialBy, EntityOptionalKeys } from './base';
import type {
    JSONSchema,
    UISchema,
    Layout as LayoutUiSchema,
} from '@educorvi/vue-json-form-schemas';
import { Layout, UI_SCHEMA_VERSION } from './utils';
import type { SchemaGenerator } from './schema-generator';

type FormData = z.infer<typeof Form.schema>;
const formDefaults = {
    type: 'form' as const,
    children: [],
    layout: Layout.Vertical,
};
type FormOptionalKeys = keyof typeof formDefaults | EntityOptionalKeys;
export class Form extends Entity {
    data: FormData;

    static schema = super.schema.extend({
        type: z.literal('form'),
        title: z.string(),
        description: z.string().optional(),
        layout: z.enum(Layout),
        children: z.array(z.string()),
    });

    constructor(
        // "children" is optional in the constructor
        data: PartialBy<FormData, FormOptionalKeys>
    ) {
        super(data);
        this.data = Form.setDefaults(data);
    }

    protected static setDefaults(
        data: PartialBy<FormData, FormOptionalKeys>
    ): FormData {
        return {
            ...super.setDefaults(data),
            ...formDefaults,
            // children must never be a shared array — every form gets its own
            children: data.children ? [...data.children] : [],
            ...data,
        };
    }

    get children(): string[] {
        return this.data.children;
    }

    get title(): string {
        return this.data.title;
    }

    getScopePart(): string[] {
        return ['properties'];
    }

    toUiSchema(generator: SchemaGenerator, _scope: string[] = []): UISchema {
        const uiSchema: UISchema = {
            version: UI_SCHEMA_VERSION,
            layout: this.toLayoutUiSchema(generator, _scope),
        };
        return uiSchema;
    }

    toLayoutUiSchema(
        generator: SchemaGenerator,
        scope: string[] = []
    ): LayoutUiSchema {
        return {
            type: this.data.layout,
            elements: generator.generateUiSchemaForElements(
                this.data.children,
                [...scope, 'properties']
            ),
        };
    }

    toJsonSchema(
        generator: SchemaGenerator,
        _scope: string[] = ['properties']
    ): JSONSchema {
        const { childrenJsonSchema, requiredList } =
            generator.generateJsonSchemaForElements(this.data.children, [
                'properties',
            ]);

        const allOf = generator.generatorHelperAttributes.allOf;
        const jsonSchema: JSONSchema = {
            type: 'object',
            properties: childrenJsonSchema,
            required: requiredList,
            ...(allOf && allOf.length > 0 && { allOf: allOf }),
        };
        return jsonSchema;
    }
}
