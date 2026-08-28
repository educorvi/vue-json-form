import { z } from 'zod';
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { FormElement } from './form-element';
import type { SchemaGenerator } from './schema-generator';

// TODO
export class ReferenceElement extends FormElement {
    // id of the referenced element (of type )
    referenceId!: string;

    schema = FormElement.schema.extend({
        referenceId: z.string(),
    });

    toUiSchema(_generator: SchemaGenerator, _scope: string[]): Control {
        // TODO
        return {
            type: 'Control',
            scope: `#/properties/${this.referenceId}`,
        };
    }

    toJsonSchema(_generator: SchemaGenerator, _scope: string[]): JSONSchema {
        // TODO
        return {};
    }

    static fromJsonSchemaAndUiSchema(
        id: string,
        _jsonSchema: JSONSchema = {},
        _uiSchema: JSONSchema
    ): ReferenceElement {
        // TODO
        return new ReferenceElement({
            id: id,
        });
    }
}
