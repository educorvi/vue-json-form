import { z } from 'zod';
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { FormElement, FormElementOptionalKeys } from './form-element';
import type { SchemaGenerator } from './schema-generator';
import { PartialBy } from './base';

// TODO
export class ReferenceElement extends FormElement {
    // id of the referenced element (of type )
    referenceId!: string;

    schema = FormElement.schema.extend({
        referenceId: z.string(),
    });

    toUiSchema(generator: SchemaGenerator, scope: string[]): Control {
        // TODO
        return {
            type: 'Control',
            scope: `#/properties/${this.referenceId}`,
        };
    }

    toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema {
        // TODO
        return {};
    }

    static fromJsonSchemaAndUiSchema(
        id: string,
        jsonSchema: JSONSchema = {},
        uiSchema: JSONSchema
    ): ReferenceElement {
        // TODO
        return new ReferenceElement({
            id: id,
        });
    }
}
