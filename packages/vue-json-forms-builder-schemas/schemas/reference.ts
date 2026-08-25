import { z } from 'zod';
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { FormElement, FormElementOptionalKeys } from './form-element';
import type { SchemaGenerator } from './schema-generator';
import { PartialBy } from './base';

type ReferenceElementData = z.infer<typeof ReferenceElement.schema>;
const referenceElementDefaults = { type: 'reference' as const };
type ReferenceElementOptionalKeys =
    keyof typeof referenceElementDefaults | FormElementOptionalKeys;

/**
 * A reference to another element of the form (by uid). The referenced
 * element keeps its own position in the tree; the reference renders it
 * again at this position.
 */
export class ReferenceElement extends FormElement {
    data: ReferenceElementData;

    static schema = FormElement.schema.extend({
        type: z.literal('reference'),
        referenceId: z.string(), // uid of the referenced FormElement
    });

    constructor(
        data: Omit<
            PartialBy<ReferenceElementData, ReferenceElementOptionalKeys>,
            'type'
        >
    ) {
        super(data);
        this.data = ReferenceElement.setDefaults(data);
    }

    protected static setDefaults(
        data: PartialBy<ReferenceElementData, ReferenceElementOptionalKeys>
    ): ReferenceElementData {
        return {
            ...super.setDefaults(data),
            ...referenceElementDefaults,
            ...data,
        };
    }

    get referenceId(): string {
        return this.data.referenceId;
    }

    toUiSchema(generator: SchemaGenerator, scope: string[]): Control {
        const referenced = generator.document.getElementById(
            this.data.referenceId
        );
        if (referenced) {
            const uiSchema = referenced.toUiSchema(generator, scope);
            if (uiSchema && uiSchema.type === 'Control') {
                return uiSchema as Control;
            }
        }
        return {
            type: 'Control',
            scope: '/' + scope.join('/') + '/' + this.id,
        };
    }

    toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema {
        const referenced = generator.document.getElementById(
            this.data.referenceId
        );
        if (referenced) {
            return referenced.toJsonSchema(generator, scope);
        }
        return {};
    }

    static fromJsonSchemaAndUiSchema(
        id: string,
        _jsonSchema: JSONSchema = {},
        _uiSchema: Control
    ): ReferenceElement {
        return new ReferenceElement({ id: id, referenceId: '' });
    }
}
