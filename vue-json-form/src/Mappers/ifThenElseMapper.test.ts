import { describe, it, expect, beforeEach } from 'vitest';
import type {
    JSONSchema,
    Control,
    Layout,
} from '@educorvi/vue-json-form-schemas';
import { IfThenElseMapper } from '.';

function makeControl(scope = '/properties/x'): Control {
    return {
        type: 'Control',
        scope,
    };
}

function makeLayout(): Layout {
    // Minimal layout object; the mapper does not use concrete structure beyond presence
    return {
        type: 'VerticalLayout',
        elements: [],
    };
}

describe('IfThenElseMapper', () => {
    let mapper: IfThenElseMapper;

    beforeEach(() => {
        mapper = new IfThenElseMapper();
    });

    it('applies "then" properties when conditions are fulfilled', async () => {
        const fieldScope = '/properties/x';
        const savePath = '/properties';

        const jsonSchema: JSONSchema = {
            allOf: [
                {
                    if: {
                        properties: {
                            country: { const: 'DE' },
                        },
                    },
                    then: {
                        properties: {
                            x: {
                                type: 'string',
                                minLength: 2,
                                enum: ['a', 'b'],
                            },
                        },
                    },
                    else: {
                        properties: {
                            x: {
                                type: 'string',
                                minLength: 0,
                                enum: ['a', 'b'],
                            },
                        },
                    },
                },
            ],
        };

        const uiSchema = makeLayout();
        const ui = makeControl(fieldScope);

        const initialJson: JSONSchema = {};
        mapper.registerSchemata(
            jsonSchema,
            uiSchema,
            fieldScope,
            savePath,
            initialJson,
            ui
        );

        const data: Record<string, any> = {
            '/country': 'DE',
        };
        const result = await mapper.map(initialJson, ui, data);
        expect(result).not.toBeNull();
        const { jsonElement, uiElement } = result!;

        // UI element is passed through
        expect(uiElement).toBe(ui);
        // Then properties applied
        expect(jsonElement.type).toBe('string');
        expect(jsonElement.minLength).toBe(2);
    });

    it('applies "else" properties when conditions are not fulfilled', async () => {
        const fieldScope = '/properties/x';
        const savePath = '/properties';

        const jsonSchema: JSONSchema = {
            allOf: [
                {
                    if: {
                        properties: {
                            country: { const: 'DE' },
                        },
                    },
                    then: {
                        properties: {
                            x: {
                                type: 'string',
                                minLength: 2,
                                enum: ['a', 'b'],
                            },
                        },
                    },
                    else: {
                        properties: {
                            x: {
                                type: 'string',
                                minLength: 0,
                                enum: ['a', 'b'],
                            },
                        },
                    },
                },
            ],
        };

        const uiSchema = makeLayout();
        const ui = makeControl(fieldScope);

        const initialJson: JSONSchema = {};
        mapper.registerSchemata(
            jsonSchema,
            uiSchema,
            fieldScope,
            savePath,
            initialJson,
            ui
        );

        const data: Record<string, any> = {
            '/country': 'US',
        };
        const result = await mapper.map(initialJson, ui, data);
        expect(result).not.toBeNull();
        const { jsonElement } = result!;

        // Else properties applied
        expect(jsonElement.type).toBe('string');
        expect(jsonElement.minLength).toBe(0);
    });

    it('merges results of multiple matching "if-then" rules in order', async () => {
        const fieldScope = '/properties/x';
        const savePath = '/properties';

        const jsonSchema: JSONSchema = {
            allOf: [
                {
                    if: { properties: { country: { const: 'DE' } } },
                    then: {
                        properties: {
                            x: {
                                type: 'string',
                                minLength: 2,
                                enum: ['a', 'b'],
                                maxLength: 10,
                            },
                        },
                    },
                },
                {
                    if: { properties: { role: { const: 'admin' } } },
                    then: {
                        properties: {
                            x: {
                                type: 'string',
                                minLength: 5,
                                format: 'email',
                                enum: ['a', 'b'],
                            },
                        },
                    },
                },
            ],
        };

        const uiSchema = makeLayout();
        const ui = makeControl(fieldScope);

        const initialJson: JSONSchema = {};
        mapper.registerSchemata(
            jsonSchema,
            uiSchema,
            fieldScope,
            savePath,
            initialJson,
            ui
        );

        const data: Record<string, any> = {
            '/country': 'DE',
            '/role': 'admin',
        };
        const result = (await mapper.map(initialJson, ui, data))!;
        const { jsonElement } = result;

        // From rule1
        expect(jsonElement.type).toBe('string');
        // minLength overridden by rule2 (applied after rule1)
        expect(jsonElement.minLength).toBe(5);
        // maxLength from rule1
        expect(jsonElement.maxLength).toBe(10);
        // new prop from rule2
        expect(jsonElement.format).toBe('email');
    });

    it('collects dependencies for all referenced condition keys and deduplicates them', () => {
        const fieldScope = '/properties/x';
        const savePath = '/properties';

        const jsonSchema: JSONSchema = {
            allOf: [
                {
                    if: { properties: { a: { const: 1 }, b: { const: 2 } } },
                    then: {
                        properties: { x: { type: 'number', enum: [1, 2] } },
                    },
                },
                {
                    if: { properties: { a: { const: 3 } } },
                    then: { properties: { x: { minimum: 0, enum: [1, 2] } } },
                },
            ],
        } as unknown as JSONSchema;

        const uiSchema = makeLayout();
        const ui = makeControl(fieldScope);

        mapper.registerSchemata(
            jsonSchema,
            uiSchema,
            fieldScope,
            savePath,
            {},
            ui
        );

        const deps = mapper.getDependencies();
        // sliceScope(savePath, -1) is '' for '/properties', therefore deps are '/<key>'
        expect(deps.sort()).toEqual(['/a', '/b']);
    });

    it('passes through unchanged when no matching allOf with supported if/then[/else] exists', async () => {
        const fieldScope = '/properties/x';
        const savePath = '/properties';

        const jsonSchema: JSONSchema = {
            // allOf missing entirely
        };

        const uiSchema = makeLayout();
        const ui = makeControl(fieldScope);

        const initialJson: JSONSchema = { type: 'integer' };
        mapper.registerSchemata(
            jsonSchema,
            uiSchema,
            fieldScope,
            savePath,
            initialJson,
            ui
        );

        const result = await mapper.map(initialJson, ui, {});
        expect(result).not.toBeNull();
        // Should be exact same references when nothing changed
        expect(result!.jsonElement).toBe(initialJson);
        expect(result!.uiElement).toBe(ui);
    });
});
