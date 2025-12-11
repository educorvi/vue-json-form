import { describe, it, expect, beforeEach } from 'vitest';
import type {
    JSONSchema,
    Control,
    Layout,
} from '@educorvi/vue-json-form-schemas';
import { DependentRequiredMapper } from './dependentRequiredMapper';

function makeControl(scope = '/properties/myField'): Control {
    return {
        type: 'Control',
        scope,
    };
}

function makeLayout(): Layout {
    return {
        type: 'VerticalLayout',
        elements: [],
    };
}

describe('DependentRequiredMapper', () => {
    let mapper: DependentRequiredMapper;

    beforeEach(() => {
        mapper = new DependentRequiredMapper();
    });

    it('identifies dependencies from dependentRequired in parent schema', () => {
        const fieldScope = '/properties/myField';
        const savePath = '/properties';
        const jsonSchema: JSONSchema = {
            type: 'object',
            properties: {
                triggerField: { type: 'boolean' },
                myField: { type: 'string' },
            },
            dependentRequired: {
                triggerField: ['myField'],
            },
        };

        const uiSchema = makeLayout();
        const ui = makeControl(fieldScope);
        const jsonElement: JSONSchema = { type: 'string' };

        mapper.registerSchemata(
            jsonSchema,
            uiSchema,
            fieldScope,
            savePath,
            jsonElement,
            ui
        );

        const deps = mapper.getDependencies();
        expect(deps).toContain('/triggerField');
        expect(deps.length).toBe(1);
    });

    it('sets forceRequired=true when dependency is present in data', async () => {
        const fieldScope = '/properties/myField';
        const savePath = '/properties';
        const jsonSchema: JSONSchema = {
            type: 'object',
            properties: {
                triggerField: { type: 'boolean' },
                myField: { type: 'string' },
            },
            dependentRequired: {
                triggerField: ['myField'],
            },
        };

        const uiSchema = makeLayout();
        const ui = makeControl(fieldScope);
        const jsonElement: JSONSchema = { type: 'string' };

        mapper.registerSchemata(
            jsonSchema,
            uiSchema,
            fieldScope,
            savePath,
            jsonElement,
            ui
        );

        const data = {
            '/triggerField': true,
        };

        const result = await mapper.map(jsonElement, ui, data);
        expect(result).not.toBeNull();
        expect(result!.uiElement.options?.forceRequired).toBe(true);
    });

    it('does not set forceRequired when dependency is missing in data', async () => {
        const fieldScope = '/properties/myField';
        const savePath = '/properties';
        const jsonSchema: JSONSchema = {
            type: 'object',
            properties: {
                triggerField: { type: 'boolean' },
                myField: { type: 'string' },
            },
            dependentRequired: {
                triggerField: ['myField'],
            },
        };

        const uiSchema = makeLayout();
        const ui = makeControl(fieldScope);
        const jsonElement: JSONSchema = { type: 'string' };

        mapper.registerSchemata(
            jsonSchema,
            uiSchema,
            fieldScope,
            savePath,
            jsonElement,
            ui
        );

        const data = {
            // triggerField missing
            '/otherField': 'someValue',
        };

        const result = await mapper.map(jsonElement, ui, data);
        expect(result).not.toBeNull();
        expect(result!.uiElement.options?.forceRequired).toBeUndefined();
    });

    it('handles multiple dependencies for the same field', async () => {
        const fieldScope = '/properties/myField';
        const savePath = '/properties';
        const jsonSchema: JSONSchema = {
            type: 'object',
            properties: {
                trigger1: { type: 'boolean' },
                trigger2: { type: 'boolean' },
                myField: { type: 'string' },
            },
            dependentRequired: {
                trigger1: ['myField'],
                trigger2: ['myField'],
            },
        };

        const uiSchema = makeLayout();
        const ui = makeControl(fieldScope);
        const jsonElement: JSONSchema = { type: 'string' };

        mapper.registerSchemata(
            jsonSchema,
            uiSchema,
            fieldScope,
            savePath,
            jsonElement,
            ui
        );

        expect(mapper.getDependencies()).toContain('/trigger1');
        expect(mapper.getDependencies()).toContain('/trigger2');

        // Case 1: trigger1 present
        let result = await mapper.map(jsonElement, ui, { '/trigger1': true });
        expect(result!.uiElement.options?.forceRequired).toBe(true);

        // Case 2: trigger2 present
        result = await mapper.map(jsonElement, ui, { '/trigger2': true });
        expect(result!.uiElement.options?.forceRequired).toBe(true);

        // Case 3: neither present
        result = await mapper.map(jsonElement, ui, {});
        expect(result!.uiElement.options?.forceRequired).toBeUndefined();
    });
});
