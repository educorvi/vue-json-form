import { z } from 'zod';
import type { JSONSchema, Divider } from '@educorvi/vue-json-form-schemas';
import { FormElement, FormElementOptionalKeys } from './form-element';
import type { SchemaGenerator } from './schema-generator';
import { PartialBy } from './base';
import { createShowOnProperty } from './children-schema-utils';

type DividerElementData = z.infer<typeof DividerElement.schema>;
const dividerElementDefaults = { type: 'divider' as const };
type DividerElementOptionalKeys =
    keyof typeof dividerElementDefaults | FormElementOptionalKeys;
export class DividerElement extends FormElement {
    data: DividerElementData;

    static schema = FormElement.schema.extend({
        type: z.literal('divider'),
    });

    constructor(
        data: Omit<
            PartialBy<DividerElementData, DividerElementOptionalKeys>,
            'type'
        >
    ) {
        super(data);
        this.data = DividerElement.setDefaults(data);
    }

    protected static setDefaults(
        data: PartialBy<DividerElementData, DividerElementOptionalKeys>
    ): DividerElementData {
        return {
            ...super.setDefaults(data),
            ...dividerElementDefaults,
            ...data,
        };
    }

    toUiSchema(_generator: SchemaGenerator, scope: string[]): Divider {
        const uiSchema: Divider = {
            type: 'Divider',
        };

        const showOn = createShowOnProperty(
            this.dependencyGroup,
            _generator,
            scope
        );
        if (showOn) {
            uiSchema.showOn = showOn;
        }

        return uiSchema;
    }

    toJsonSchema(_generator: SchemaGenerator, _scope: string[]): JSONSchema {
        return {};
    }

    static fromJsonSchemaAndUiSchema(
        id: string,
        jsonSchema: JSONSchema = {},
        uiSchema: Divider
    ): DividerElement {
        void jsonSchema;
        void uiSchema;
        return new DividerElement({ id: id });
        // TODO handle dependencyGroup if needed
    }
}
