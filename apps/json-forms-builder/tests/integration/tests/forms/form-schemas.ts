import type { JSONSchema, UISchema } from '@educorvi/vue-json-form-schemas';

/**
 * Shared typed JSON/UI schemas for form version & schema tests.
 *
 * Typed against the Vue JSON Form schema package
 * (`@educorvi/vue-json-form-schemas`) so the test data is validated at
 * compile time against the real schema shapes.
 */

export const JSON_SCHEMA_V1: JSONSchema = {
    type: 'object',
    properties: { name: { type: 'string' } },
};

export const UI_SCHEMA_V1: UISchema = {
    version: '2.2',
    layout: {
        type: 'VerticalLayout',
        elements: [{ type: 'Control', scope: '#/properties/name' }],
    },
};

export const JSON_SCHEMA_V2: JSONSchema = {
    type: 'object',
    properties: {
        name: { type: 'string' },
        age: { type: 'number' },
    },
};

export const UI_SCHEMA_V2: UISchema = {
    version: '2.2',
    layout: {
        type: 'VerticalLayout',
        elements: [
            { type: 'Control', scope: '#/properties/name' },
            { type: 'Control', scope: '#/properties/age' },
        ],
    },
};

export const SCHEMA_V1 = {
    json: JSON_SCHEMA_V1,
    ui: UI_SCHEMA_V1,
};

export const SCHEMA_V2 = {
    json: JSON_SCHEMA_V2,
    ui: UI_SCHEMA_V2,
};

export const VERSION_1 = {
    version: '1.0.0',
    comment: 'Initial version',
    ...SCHEMA_V1,
};

export const VERSION_2 = {
    version: '2.0.0',
    comment: 'Second version',
    ...SCHEMA_V2,
};
