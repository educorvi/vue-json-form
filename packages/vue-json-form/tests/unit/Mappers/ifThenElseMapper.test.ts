import { describe, it, expect, beforeEach } from 'vitest';
import type {
    JSONSchema,
    Control,
    Layout,
} from '@educorvi/vue-json-form-schemas';
import { IfThenElseMapper } from '@/Mappers';

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
        const savePath = '/properties/x';

        const jsonSchema: JSONSchema = {
            properties: {
                country: { type: 'string' },
            },
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
            '/properties/country': 'DE',
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
        const savePath = '/properties/x';

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
            '/properties/country': 'US',
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
        const savePath = '/properties/x';

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
            '/properties/country': 'DE',
            '/properties/role': 'admin',
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
        const savePath = '/properties/x';

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
        expect(deps.sort()).toEqual(['/properties/a', '/properties/b']);
    });

    it('passes through unchanged when no matching allOf with supported if/then[/else] exists', async () => {
        const fieldScope = '/properties/x';
        const savePath = '/properties/x';

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

    it('correctly applies required', async () => {
        const fieldScope = '/properties/x';
        const savePath = '/properties/x';

        const jsonSchema: JSONSchema = {
            allOf: [
                {
                    if: {
                        properties: {
                            country: { const: 'DE' },
                        },
                    },
                    then: {
                        required: ['x'],
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
            '/properties/country': 'DE',
        };
        const result = await mapper.map(initialJson, ui, data);
        expect(result).not.toBeNull();
        const { uiElement } = result!;

        expect(uiElement.options?.forceRequired).toBe(true);
    });

    it('supports required-only conditions in if', async () => {
        const fieldScope = '/properties/x';
        const savePath = '/properties/x';

        const jsonSchema: JSONSchema = {
            allOf: [
                {
                    if: {
                        required: ['flag'],
                    },
                    then: {
                        properties: {
                            x: { minLength: 2 },
                        },
                    },
                    else: {
                        properties: {
                            x: { minLength: 0 },
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

        let data: Record<string, any> = {
            '/properties/flag': true,
        };
        let result = await mapper.map(initialJson, ui, data);
        expect(result!.jsonElement.minLength).toBe(2);

        data = {};
        result = await mapper.map(initialJson, ui, data);
        expect(result!.jsonElement.minLength).toBe(0);
    });

    it('treats undefined and null as not fulfilled for required conditions in if', async () => {
        const fieldScope = '/properties/x';
        const savePath = '/properties/x';

        const jsonSchema: JSONSchema = {
            allOf: [
                {
                    if: {
                        required: ['flag'],
                    },
                    then: {
                        properties: {
                            x: { title: 'required matched' },
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

        let data: Record<string, any> = {
            '/properties/flag': undefined,
        };
        let result = await mapper.map(initialJson, ui, data);
        expect(result!.jsonElement.title).toBeUndefined();

        data = {
            '/properties/flag': null,
        };
        result = await mapper.map(initialJson, ui, data);
        expect(result!.jsonElement.title).toBeUndefined();
    });

    it('combines required and const conditions in if', async () => {
        const fieldScope = '/properties/x';
        const savePath = '/properties/x';

        const jsonSchema: JSONSchema = {
            allOf: [
                {
                    if: {
                        required: ['mode'],
                        properties: {
                            mode: { const: 'strict' },
                        },
                    },
                    then: {
                        properties: {
                            x: { minLength: 4 },
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

        let data: Record<string, any> = {
            '/properties/mode': 'strict',
        };
        let result = await mapper.map(initialJson, ui, data);
        expect(result!.jsonElement.minLength).toBe(4);

        data = {
            '/properties/mode': 'lenient',
        };
        result = await mapper.map(initialJson, ui, data);
        expect(result!.jsonElement.minLength).toBeUndefined();

        data = {};
        result = await mapper.map(initialJson, ui, data);
        expect(result!.jsonElement.minLength).toBeUndefined();
    });

    it('supports nested required conditions in if properties', async () => {
        const fieldScope = '/properties/x';
        const savePath = '/properties/x';

        const jsonSchema: JSONSchema = {
            allOf: [
                {
                    if: {
                        properties: {
                            group: {
                                required: ['toggle'],
                            },
                        },
                    },
                    then: {
                        properties: {
                            x: { minLength: 6 },
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

        let data: Record<string, any> = {
            '/properties/group/properties/toggle': 'present',
        };
        let result = await mapper.map(initialJson, ui, data);
        expect(result!.jsonElement.minLength).toBe(6);

        data = {
            '/properties/group/properties/toggle': null,
        };
        result = await mapper.map(initialJson, ui, data);
        expect(result!.jsonElement.minLength).toBeUndefined();
    });

    it('maps nested requireds for JSO-146 reproduce schema without a parent object value', async () => {
        const fieldScope =
            '/properties/jso-146/properties/objekt/properties/abhaengiges-pflichtfeld-in-objekt';
        const savePath = fieldScope;

        const jsonSchema: JSONSchema = {
            type: 'object',
            properties: {
                'jso-146': {
                    type: 'object',
                    allOf: [
                        {
                            if: {
                                properties: {
                                    objekt: {
                                        properties: {
                                            'unabhaengiges-feld-in-objekt': {
                                                minLength: 1,
                                            },
                                        },
                                        required: [
                                            'unabhaengiges-feld-in-objekt',
                                        ],
                                    },
                                },
                                required: ['objekt'],
                            },
                            then: {
                                properties: {
                                    objekt: {
                                        properties: {
                                            'abhaengiges-pflichtfeld-in-objekt': {
                                                minLength: 1,
                                            },
                                        },
                                        required: [
                                            'abhaengiges-pflichtfeld-in-objekt',
                                        ],
                                    },
                                },
                                required: ['objekt'],
                            },
                        },
                    ],
                    properties: {
                        objekt: {
                            type: 'object',
                            properties: {
                                'unabhaengiges-feld-in-objekt': {
                                    type: 'string',
                                },
                                'abhaengiges-pflichtfeld-in-objekt': {
                                    type: 'string',
                                },
                            },
                        },
                    },
                },
            },
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

        let data: Record<string, any> = {
            '/properties/jso-146/properties/objekt/properties/unabhaengiges-feld-in-objekt':
                'triggered',
        };
        let result = await mapper.map(initialJson, ui, data);
        expect(result).not.toBeNull();
        expect(result!.jsonElement.minLength).toBe(1);
        expect(result!.uiElement.options?.forceRequired).toBe(true);

        data = {
            '/properties/jso-146/properties/objekt/properties/unabhaengiges-feld-in-objekt':
                '',
        };
        result = await mapper.map(initialJson, ui, data);
        expect(result).not.toBeNull();
        expect(result!.jsonElement.minLength).toBeUndefined();
        expect(result!.uiElement.options?.forceRequired).not.toBe(true);

        data = {};
        result = await mapper.map(initialJson, ui, data);
        expect(result).not.toBeNull();
        expect(result!.jsonElement.minLength).toBeUndefined();
        expect(result!.uiElement.options?.forceRequired).not.toBe(true);
    });

    it('adds dependencies for keys introduced by required conditions in if', () => {
        const fieldScope = '/properties/x';
        const savePath = '/properties/x';

        const jsonSchema: JSONSchema = {
            allOf: [
                {
                    if: {
                        required: ['flag'],
                    },
                    then: {
                        properties: {
                            x: { minLength: 2 },
                        },
                    },
                },
                {
                    if: {
                        required: ['flag'],
                    },
                    then: {
                        properties: {
                            x: { maxLength: 10 },
                        },
                    },
                },
            ],
        };

        mapper.registerSchemata(
            jsonSchema,
            makeLayout(),
            fieldScope,
            savePath,
            {},
            makeControl(fieldScope)
        );

        expect(mapper.getDependencies()).toEqual(['/properties/flag']);
    });

    it('handles deep conditions for shallow fields', async () => {
        const fieldScope = '/properties/target';
        const savePath = '/properties/x';

        const jsonSchema: JSONSchema = {
            properties: {
                target: { type: 'string' },
                nested: {
                    type: 'object',
                    properties: {
                        trigger: { type: 'string' },
                    },
                },
            },
            allOf: [
                {
                    if: {
                        properties: {
                            nested: {
                                properties: {
                                    trigger: { const: 'ON' },
                                },
                            },
                        },
                    },
                    then: {
                        properties: {
                            target: { minLength: 5 },
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
            '/properties/nested/properties/trigger': 'ON',
        };

        const result = await mapper.map(initialJson, ui, data);
        expect(result).not.toBeNull();
        expect(result!.jsonElement.minLength).toBe(5);
    });

    it('handles shallow conditions for deep fields', async () => {
        const fieldScope = '/properties/nested/properties/target';
        const savePath = '/properties/nested/properties/target';

        const jsonSchema: JSONSchema = {
            properties: {
                trigger: { type: 'string' },
                nested: {
                    type: 'object',
                    properties: {
                        target: { type: 'string' },
                    },
                },
            },
            allOf: [
                {
                    if: {
                        properties: {
                            trigger: { const: 'ON' },
                        },
                    },
                    then: {
                        properties: {
                            nested: {
                                properties: {
                                    target: { minLength: 5 },
                                },
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
            '/properties/trigger': 'ON',
        };

        const result = await mapper.map(initialJson, ui, data);
        expect(result).not.toBeNull();
        expect(result!.jsonElement.minLength).toBe(5);
    });

    it('handles deep conditions for deep fields (sibling branches)', async () => {
        const fieldScope = '/properties/branchB/properties/target';
        const savePath = '/properties/branchB/properties/target';

        const jsonSchema: JSONSchema = {
            properties: {
                branchA: {
                    type: 'object',
                    properties: {
                        trigger: { type: 'string' },
                    },
                },
                branchB: {
                    type: 'object',
                    properties: {
                        target: { type: 'string' },
                    },
                },
            },
            allOf: [
                {
                    if: {
                        properties: {
                            branchA: {
                                properties: {
                                    trigger: { const: 'ON' },
                                },
                            },
                        },
                    },
                    then: {
                        properties: {
                            branchB: {
                                properties: {
                                    target: { minLength: 5 },
                                },
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
            '/properties/branchA/properties/trigger': 'ON',
        };

        const result = await mapper.map(initialJson, ui, data);
        expect(result).not.toBeNull();
        expect(result!.jsonElement.minLength).toBe(5);
    });

    it('handles objects in array items', async () => {
        const data = {
            '/properties/jso-96/properties/ja-oder-nein': undefined,
            '/properties/jso-96/properties/array': [
                'vjf_array-item_6645b28f-b52d-4d0d-914e-c66f5cb4d5e1',
                'vjf_array-item_3089b7c0-05d0-407c-b699-d3cf877ae369',
            ],
            '/properties/jso-96/properties/array.vjf_array-item_6645b28f-b52d-4d0d-914e-c66f5cb4d5e1':
                '',
            '/properties/jso-96/properties/array.vjf_array-item_6645b28f-b52d-4d0d-914e-c66f5cb4d5e1/properties/check': false,
            '/properties/jso-96/properties/array.vjf_array-item_3089b7c0-05d0-407c-b699-d3cf877ae369':
                '',
            '/properties/jso-96/properties/array.vjf_array-item_3089b7c0-05d0-407c-b699-d3cf877ae369/properties/check': true,
        };

        const fieldScope =
            '/properties/jso-96/properties/array/items/properties/feld';
        const savePathTrue =
            '/properties/jso-96/properties/array.vjf_array-item_3089b7c0-05d0-407c-b699-d3cf877ae369/properties/feld';
        const savePathFalse =
            '/properties/jso-96/properties/array.vjf_array-item_6645b28f-b52d-4d0d-914e-c66f5cb4d5e1/properties/feld';

        const jsonSchema: JSONSchema = {
            properties: {
                'jso-96': {
                    type: 'object',
                    properties: {
                        array: {
                            type: 'array',
                            title: 'Array',
                            items: {
                                type: 'object',
                                properties: {
                                    check: {
                                        type: 'boolean',
                                    },
                                    feld: {
                                        title: 'Feld',
                                        type: 'string',
                                    },
                                },
                                allOf: [
                                    {
                                        if: {
                                            properties: {
                                                check: {
                                                    const: true,
                                                },
                                            },
                                            required: ['check'],
                                        },
                                        then: {
                                            required: ['feld'],
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            },
        };

        const uiSchema = makeLayout();
        const ui = makeControl(fieldScope);
        const initialJson: JSONSchema = {};

        mapper.registerSchemata(
            jsonSchema,
            uiSchema,
            fieldScope,
            savePathFalse,
            initialJson,
            ui
        );

        let result = await mapper.map(initialJson, ui, data);
        expect(result).not.toBeNull();
        expect(result!.uiElement.options?.forceRequired).not.toBe(true);

        mapper.registerSchemata(
            jsonSchema,
            uiSchema,
            fieldScope,
            savePathTrue,
            initialJson,
            ui
        );

        result = await mapper.map(initialJson, ui, data);
        expect(result).not.toBeNull();
        expect(result!.uiElement.options?.forceRequired).toBe(true);
    });

    it('supports "enum" condition', async () => {
        const fieldScope = '/properties/x';
        const savePath = '/properties/x';

        const jsonSchema: JSONSchema = {
            allOf: [
                {
                    if: {
                        properties: {
                            country: { enum: ['DE', 'AT'] },
                        },
                    },
                    then: {
                        properties: {
                            x: { minLength: 5 },
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

        // Match DE
        let data: Record<string, any> = { '/properties/country': 'DE' };
        let result = await mapper.map(initialJson, ui, data);
        expect(result!.jsonElement.minLength).toBe(5);

        // Match AT
        data = { '/properties/country': 'AT' };
        result = await mapper.map(initialJson, ui, data);
        expect(result!.jsonElement.minLength).toBe(5);

        // No match US
        data = { '/properties/country': 'US' };
        result = await mapper.map(initialJson, ui, data);
        expect(result!.jsonElement.minLength).toBeUndefined();
    });

    it('supports "contains" with "const" condition', async () => {
        const fieldScope = '/properties/x';
        const savePath = '/properties/x';

        const jsonSchema: JSONSchema = {
            allOf: [
                {
                    if: {
                        properties: {
                            tags: { contains: { const: 'urgent' } },
                        },
                    },
                    then: {
                        properties: {
                            x: { minLength: 5 },
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

        // Match
        let data: Record<string, any> = {
            '/properties/tags': ['work', 'urgent'],
        };
        let result = await mapper.map(initialJson, ui, data);
        expect(result!.jsonElement.minLength).toBe(5);

        // No match
        data = { '/properties/tags': ['work'] };
        result = await mapper.map(initialJson, ui, data);
        expect(result!.jsonElement.minLength).toBeUndefined();

        // Not an array
        data = { '/properties/tags': 'urgent' };
        result = await mapper.map(initialJson, ui, data);
        expect(result!.jsonElement.minLength).toBeUndefined();
    });

    it('supports "contains" with "enum" condition', async () => {
        const fieldScope = '/properties/x';
        const savePath = '/properties/x';

        const jsonSchema: JSONSchema = {
            allOf: [
                {
                    if: {
                        properties: {
                            tags: {
                                contains: { enum: ['urgent', 'important'] },
                            },
                        },
                    },
                    then: {
                        properties: {
                            x: { minLength: 5 },
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

        // Match urgent
        let data: Record<string, any> = {
            '/properties/tags': ['work', 'urgent'],
        };
        let result = await mapper.map(initialJson, ui, data);
        expect(result!.jsonElement.minLength).toBe(5);

        // Match important
        data = { '/properties/tags': ['important', 'home'] };
        result = await mapper.map(initialJson, ui, data);
        expect(result!.jsonElement.minLength).toBe(5);

        // No match
        data = { '/properties/tags': ['work', 'home'] };
        result = await mapper.map(initialJson, ui, data);
        expect(result!.jsonElement.minLength).toBeUndefined();

        // Not an array
        data = { '/properties/tags': 'urgent' };
        result = await mapper.map(initialJson, ui, data);
        expect(result!.jsonElement.minLength).toBeUndefined();
    });

    it('dependentField is conditionally required when isEnabled is true', async () => {
        const fieldScope = '/properties/dependentField';
        const savePath = '/properties/dependentField';

        const jsonSchema: JSONSchema = {
            title: 'problem required in if then ändert parent',
            type: 'object',
            allOf: [
                {
                    if: {
                        properties: {
                            isEnabled: {
                                const: true,
                            },
                        },
                        required: ['isEnabled'],
                    },
                    then: {
                        properties: {
                            dependentField: {
                                minLength: 1,
                            },
                        },
                        required: ['dependentField'],
                    },
                },
            ],
            properties: {
                isEnabled: {
                    title: 'isEnabled',
                    type: 'boolean',
                },
                dependentField: {
                    title: 'dependentField',
                    type: 'string',
                    minLength: 1,
                },
            },
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

        // Test case 1: isEnabled is true - dependentField should be required
        let data: Record<string, any> = {
            '/properties/isEnabled': true,
        };
        let result = await mapper.map(initialJson, ui, data);
        expect(result).not.toBeNull();
        expect(result!.uiElement.options?.forceRequired).toBe(true);
        expect(result!.jsonElement.minLength).toBe(1);

        // Test case 2: isEnabled is false - dependentField should not be required
        data = {
            '/properties/isEnabled': false,
        };
        result = await mapper.map(initialJson, ui, data);
        expect(result).not.toBeNull();
        // When condition is not met, forceRequired should not be set or should be falsy
        expect(result!.uiElement.options?.forceRequired).not.toBe(true);

        // Test case 3: isEnabled is undefined/missing - dependentField should not be required
        data = {};
        result = await mapper.map(initialJson, ui, data);
        expect(result).not.toBeNull();
        expect(result!.uiElement.options?.forceRequired).not.toBe(true);
    });

    it('dependentField is conditionally required when isEnabled is true (long)', async () => {
        const fieldScope = '/properties/dependentField';
        const savePath = '/properties/dependentField';

        const jsonSchema: JSONSchema = {
            title: 'problem required in if then ändert parent',
            type: 'object',
            allOf: [
                {
                    if: {
                        properties: {
                            isEnabled: {
                                const: true,
                            },
                        },
                        required: ['isEnabled'],
                    },
                    then: {
                        properties: {
                            'optionales-array': {
                                items: {
                                    properties: {
                                        'immer-pflichtfeld': {
                                            minLength: 1,
                                        },
                                    },
                                    required: ['immer-pflichtfeld'],
                                },
                            },
                        },
                        required: ['optionales-array'],
                    },
                },
                {
                    if: {
                        properties: {
                            'optionales-array': {
                                items: {
                                    properties: {
                                        'optionales-feld-mit-abhaengigkeiten': {
                                            minLength: 1,
                                        },
                                    },
                                    required: [
                                        'optionales-feld-mit-abhaengigkeiten',
                                    ],
                                },
                            },
                        },
                        required: ['optionales-array'],
                    },
                    then: {
                        properties: {
                            'optionales-array': {
                                items: {
                                    properties: {
                                        'abhaengiges-pflichtfeld': {
                                            minLength: 1,
                                        },
                                    },
                                    required: ['abhaengiges-pflichtfeld'],
                                },
                            },
                        },
                        required: ['optionales-array'],
                    },
                },
                {
                    if: {
                        properties: {
                            'optionales-objekt': {
                                properties: {
                                    'optionales-feld-mit-abhaengigkeiten': {
                                        minLength: 1,
                                    },
                                },
                                required: [
                                    'optionales-feld-mit-abhaengigkeiten',
                                ],
                            },
                        },
                        required: ['optionales-objekt'],
                    },
                    then: {
                        properties: {
                            'optionales-objekt': {
                                properties: {
                                    'abhaengiges-pflichtfeld': {
                                        minLength: 1,
                                    },
                                },
                                required: ['abhaengiges-pflichtfeld'],
                            },
                        },
                        required: ['optionales-objekt'],
                    },
                },
                {
                    if: {
                        properties: {
                            isEnabled: {
                                const: true,
                            },
                        },
                        required: ['isEnabled'],
                    },
                    then: {
                        properties: {
                            dependentField: {
                                minLength: 1,
                            },
                        },
                        required: ['dependentField'],
                    },
                },
            ],
            properties: {
                isEnabled: {
                    title: 'isEnabled',
                    type: 'boolean',
                },
                'optionales-array': {
                    title: 'optionales array',
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            'immer-pflichtfeld': {
                                title: 'immer pflichtfeld',
                                type: 'string',
                                minLength: 1,
                            },
                            'optionales-feld-mit-abhaengigkeiten': {
                                title: 'optionales feld mit abhängigkeiten',
                                type: 'string',
                            },
                            'abhaengiges-pflichtfeld': {
                                title: 'abhängiges pflichtfeld',
                                type: 'string',
                                minLength: 1,
                            },
                        },
                    },
                },
                'optionales-objekt': {
                    title: 'optionales objekt',
                    type: 'object',
                    required: ['pflichfeld'],
                    properties: {
                        pflichfeld: {
                            title: 'pflichfeld',
                            type: 'string',
                            minLength: 1,
                        },
                        'optionales-feld-mit-abhaengigkeiten': {
                            title: 'optionales feld mit abhängigkeiten',
                            type: 'string',
                        },
                        'abhaengiges-pflichtfeld': {
                            title: 'abhängiges pflichtfeld',
                            type: 'string',
                            minLength: 1,
                        },
                    },
                },
                dependentField: {
                    title: 'dependentField',
                    type: 'string',
                    minLength: 1,
                },
            },
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

        // Test case 1: isEnabled is true - dependentField should be required
        let data: Record<string, any> = {
            '/properties/isEnabled': true,
        };
        let result = await mapper.map(initialJson, ui, data);
        expect(result).not.toBeNull();
        expect(result!.uiElement.options?.forceRequired).toBe(true);
        expect(result!.jsonElement.minLength).toBe(1);

        // Test case 2: isEnabled is false - dependentField should not be required
        data = {
            '/properties/isEnabled': false,
        };
        result = await mapper.map(initialJson, ui, data);
        expect(result).not.toBeNull();
        // When condition is not met, forceRequired should not be set or should be falsy
        expect(result!.uiElement.options?.forceRequired).not.toBe(true);

        // Test case 3: isEnabled is undefined/missing - dependentField should not be required
        data = {};
        result = await mapper.map(initialJson, ui, data);
        expect(result).not.toBeNull();
        expect(result!.uiElement.options?.forceRequired).not.toBe(true);
    });

    it('supports if/then/else for array items using long-schema style', async () => {
        const fieldScope =
            '/properties/optionales-array/items/properties/abhaengiges-pflichtfeld';
        const savePath =
            '/properties/optionales-array.vjf_array-item_66a10f6e-e43f-4de8-be8d-e93140a4aab2/properties/abhaengiges-pflichtfeld';

        const jsonSchema: JSONSchema = {
            title: 'if-then-else for array items',
            type: 'object',
            allOf: [
                {
                    if: {
                        properties: {
                            'optionales-array': {
                                items: {
                                    properties: {
                                        check: {
                                            const: true,
                                        },
                                    },
                                    required: ['check'],
                                },
                            },
                        },
                        required: ['optionales-array'],
                    },
                    then: {
                        properties: {
                            'optionales-array': {
                                items: {
                                    properties: {
                                        'abhaengiges-pflichtfeld': {
                                            minLength: 3,
                                        },
                                    },
                                    required: ['abhaengiges-pflichtfeld'],
                                },
                            },
                        },
                        required: ['optionales-array'],
                    },
                    else: {
                        properties: {
                            'optionales-array': {
                                items: {
                                    properties: {
                                        'abhaengiges-pflichtfeld': {
                                            minLength: 0,
                                        },
                                    },
                                },
                            },
                        },
                        required: ['optionales-array'],
                    },
                },
            ],
            properties: {
                'optionales-array': {
                    title: 'optionales array',
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            check: {
                                type: 'boolean',
                            },
                            'abhaengiges-pflichtfeld': {
                                type: 'string',
                            },
                        },
                    },
                },
            },
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

        let data: Record<string, any> = {
            '/properties/optionales-array': [
                'vjf_array-item_66a10f6e-e43f-4de8-be8d-e93140a4aab2',
            ],
            '/properties/optionales-array.vjf_array-item_66a10f6e-e43f-4de8-be8d-e93140a4aab2':
                '',
            '/properties/optionales-array.vjf_array-item_66a10f6e-e43f-4de8-be8d-e93140a4aab2/properties/check': true,
        };
        let result = await mapper.map(initialJson, ui, data);
        expect(result).not.toBeNull();
        expect(result!.jsonElement.minLength).toBe(3);
        expect(result!.uiElement.options?.forceRequired).toBe(true);

        data = {
            '/properties/optionales-array': [
                'vjf_array-item_66a10f6e-e43f-4de8-be8d-e93140a4aab2',
            ],
            '/properties/optionales-array.vjf_array-item_66a10f6e-e43f-4de8-be8d-e93140a4aab2':
                '',
            '/properties/optionales-array.vjf_array-item_66a10f6e-e43f-4de8-be8d-e93140a4aab2/properties/check': false,
        };
        result = await mapper.map(initialJson, ui, data);
        expect(result).not.toBeNull();
        expect(result!.jsonElement.minLength).toBe(0);
        expect(result!.uiElement.options?.forceRequired).not.toBe(true);
    });

    it('supports "minLength" condition', async () => {
        const fieldScope = '/properties/x';
        const savePath = '/properties/x';

        const jsonSchema: JSONSchema = {
            allOf: [
                {
                    if: {
                        properties: {
                            password: { minLength: 5 },
                        },
                    },
                    then: {
                        properties: {
                            x: { title: 'Strong Password' },
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

        // Match (length 5)
        let data: Record<string, any> = { '/properties/password': '12345' };
        let result = await mapper.map(initialJson, ui, data);
        expect(result!.jsonElement.title).toBe('Strong Password');

        // Match (length 6)
        data = { '/properties/password': '123456' };
        result = await mapper.map(initialJson, ui, data);
        expect(result!.jsonElement.title).toBe('Strong Password');

        // No match (length 4)
        data = { '/properties/password': '1234' };
        result = await mapper.map(initialJson, ui, data);
        expect(result!.jsonElement.title).toBeUndefined();

        // No match (undefined)
        data = {};
        result = await mapper.map(initialJson, ui, data);
        expect(result!.jsonElement.title).toBeUndefined();
    });
});
