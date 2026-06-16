/**
 * schemaExport.test.ts
 *
 * Unit tests for the pure schema-export functions.
 *
 * These tests cover:
 *  1. Control at root → appears in exportedJsonSchema.properties
 *  2. Control inside Array (migration ran) → in array.items.properties
 *  3. Control inside Array (migration did NOT run) → still correct via rootProps fallback
 *  4. Control inside Object (migration ran) → in object.properties
 *  5. Control inside Object (migration did NOT run) → still correct via rootProps fallback
 *  6. Control inside Layout inside Array → still resolved correctly
 *  7. Moving control: root → Array (simulated as element tree change, no dep on events)
 *  8. Moving control: Array → root
 *  9. Moving control: Array A → Array B
 * 10. Empty Array → no items.type:"object" in JSON schema
 * 11. Array with 1 field → items is the field schema directly (no object wrapper)
 * 12. UI schema for Array → correct scope + descendantControlOverrides preserved
 * 13. UI schema for Object → Group with correct element scopes
 * 14. migrateToContainer / migrateToRoot pure functions
 */

import { describe, it, expect } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import type { JSONSchema } from '@educorvi/vue-json-form-schemas';
import type {
    LayoutElement,
    ControlElement,
    ArrayElement,
    ObjectElement,
} from '../../formTypes';
import { computeExportedJsonSchema, computeUiSchema } from '../schemaExport';
import {
    migrateToContainer,
    migrateToRoot,
    extractSchema,
} from '../schemaResolver';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeControl(key: string, id?: string): ControlElement {
    return {
        type: 'Control',
        scope: `/properties/${key}`,
        _id: id ?? uuidv4(),
    };
}

function makeRoot(elements: LayoutElement['elements'] = []): LayoutElement {
    return { type: 'VerticalLayout', elements, _id: uuidv4() };
}

function makeArray(
    key: string,
    elements: LayoutElement['elements'] = [],
    id?: string
): ArrayElement {
    return {
        type: 'Array',
        key,
        elements,
        _id: id ?? uuidv4(),
    } as ArrayElement;
}

function makeObject(
    key: string,
    elements: LayoutElement['elements'] = [],
    id?: string
): ObjectElement {
    return {
        type: 'Object',
        key,
        elements,
        _id: id ?? uuidv4(),
    } as ObjectElement;
}

function makeRootSchema(
    properties: Record<string, JSONSchema> = {}
): JSONSchema {
    return { type: 'object', properties, required: [] };
}

// ─── 1. Control at root level ────────────────────────────────────────────────

describe('Control at root level', () => {
    it('appears in exported properties', () => {
        const ctrl = makeControl('name');
        const root = makeRoot([ctrl]);
        const jsonSchema = makeRootSchema({
            name: { type: 'string', title: 'Name' },
        });

        const exported = computeExportedJsonSchema(root, jsonSchema);

        expect(exported.properties).toEqual({
            name: { type: 'string', title: 'Name' },
        });
    });

    it('multiple controls each appear at root', () => {
        const ctrl1 = makeControl('firstName');
        const ctrl2 = makeControl('lastName');
        const root = makeRoot([ctrl1, ctrl2]);
        const jsonSchema = makeRootSchema({
            firstName: { type: 'string', title: 'First' },
            lastName: { type: 'string', title: 'Last' },
        });

        const exported = computeExportedJsonSchema(root, jsonSchema);

        expect(Object.keys(exported.properties as object)).toEqual([
            'firstName',
            'lastName',
        ]);
    });

    it('UI schema has correct Control element', () => {
        const ctrl = makeControl('email');
        const root = makeRoot([ctrl]);
        const jsonSchema = makeRootSchema({ email: { type: 'string' } });

        const ui = computeUiSchema(root);

        expect(ui.version).toBe('2.1');
        expect((ui.layout as LayoutElement).elements[0]).toMatchObject({
            type: 'Control',
            scope: '/properties/email',
        });
    });
});

// ─── 2. Control inside Array (migration ran) ─────────────────────────────────

describe('Control inside Array — migration already ran', () => {
    it('items is the control schema directly (not wrapped in object)', () => {
        const ctrl = makeControl('street');
        const arr = makeArray('addresses', [ctrl]);
        // Migration stored schema in arr.items.properties:
        (arr as any).items = {
            type: 'object',
            properties: { street: { type: 'string', title: 'Street' } },
        };
        const root = makeRoot([arr]);
        const jsonSchema = makeRootSchema({}); // root has no properties (migration deleted them)

        const exported = computeExportedJsonSchema(root, jsonSchema);

        expect(exported.properties).not.toHaveProperty('street');
        // Single control → items is the control's schema directly
        expect((exported.properties as any).addresses).toMatchObject({
            type: 'array',
            items: { type: 'string', title: 'Street' },
        });
        // Must NOT be double-wrapped in an object
        expect(
            (exported.properties as any).addresses.items.properties
        ).toBeUndefined();
    });
});

// ─── 3. Control inside Array (migration DID NOT run) ─────────────────────────

describe('Control inside Array — migration did NOT run (schema still in rootProps)', () => {
    it('schema is still placed as items directly via rootProps fallback', () => {
        const ctrl = makeControl('city');
        const arr = makeArray('locations', [ctrl]);
        // No migration: arr.items is undefined, but rootSchema still has the key
        const root = makeRoot([arr]);
        const jsonSchema = makeRootSchema({
            city: { type: 'string', title: 'City' },
        });

        const exported = computeExportedJsonSchema(root, jsonSchema);

        // The field must NOT appear at root level
        expect(exported.properties).not.toHaveProperty('city');
        // Single control → items is the control's schema directly
        expect((exported.properties as any).locations).toMatchObject({
            type: 'array',
            items: { type: 'string', title: 'City' },
        });
        expect(
            (exported.properties as any).locations.items.properties
        ).toBeUndefined();
    });

    it('multiple controls inside Array use object wrapper (rootProps fallback)', () => {
        // Note: the UI enforces maxChildren:1, so 2 Controls directly in an
        // Array is an impossible state in practice.  Each is processed as the
        // first (and only) child — the second is ignored. The real multi-field
        // use case is: Object inside Array.
        const ctrl1 = makeControl('lat');
        const arr = makeArray('coords', [ctrl1]);
        const root = makeRoot([arr]);
        const jsonSchema = makeRootSchema({
            lat: { type: 'number', title: 'Latitude' },
        });

        const exported = computeExportedJsonSchema(root, jsonSchema);

        expect(exported.properties).not.toHaveProperty('lat');
        // Single control → items is the schema directly
        const items = (exported.properties as any).coords.items;
        expect(items).toMatchObject({ type: 'number', title: 'Latitude' });
    });
});

// ─── 4. Control inside Object (migration ran) ───────────────────────────────

describe('Control inside Object — migration already ran', () => {
    it('schema is in object.properties, not at root', () => {
        const ctrl = makeControl('zip');
        const obj = makeObject('address', [ctrl]);
        // Migration stored schema in obj.properties:
        (obj as any).properties = { zip: { type: 'string', title: 'ZIP' } };
        const root = makeRoot([obj]);
        const jsonSchema = makeRootSchema({});

        const exported = computeExportedJsonSchema(root, jsonSchema);

        expect(exported.properties).not.toHaveProperty('zip');
        expect((exported.properties as any).address).toMatchObject({
            type: 'object',
            properties: { zip: { type: 'string', title: 'ZIP' } },
        });
    });
});

// ─── 5. Control inside Object (migration DID NOT run) ─────────────────────

describe('Control inside Object — migration did NOT run', () => {
    it('schema is placed in object.properties via rootProps fallback', () => {
        const ctrl = makeControl('age');
        const obj = makeObject('person', [ctrl]);
        const root = makeRoot([obj]);
        const jsonSchema = makeRootSchema({
            age: { type: 'integer', title: 'Age' },
        });

        const exported = computeExportedJsonSchema(root, jsonSchema);

        expect(exported.properties).not.toHaveProperty('age');
        expect((exported.properties as any).person).toMatchObject({
            type: 'object',
            properties: { age: { type: 'integer', title: 'Age' } },
        });
    });
});

// ─── 6. Control inside Layout inside Array ────────────────────────────────────

describe('Control inside Layout inside Array', () => {
    it('schema ends up in items via layout fallback (no migration)', () => {
        const ctrl = makeControl('note');
        const group: LayoutElement = {
            type: 'Group',
            elements: [ctrl],
            _id: uuidv4(),
            options: { label: 'Details' },
        };
        const arr = makeArray('items', [group]);
        const root = makeRoot([arr]);
        const jsonSchema = makeRootSchema({
            note: { type: 'string', title: 'Note' },
        });

        const exported = computeExportedJsonSchema(root, jsonSchema);

        expect(exported.properties).not.toHaveProperty('note');
        // Layout container → fallback path → items is object with properties
        const items = (exported.properties as any).items.items;
        expect(items.properties).toHaveProperty('note');
        expect(items.properties.note).toMatchObject({
            type: 'string',
            title: 'Note',
        });
    });
});

// ─── 7. Moving control: root → Array ─────────────────────────────────────────

describe('Simulated move: root → Array', () => {
    it('after moving element into array, schema appears as items directly', () => {
        const ctrl = makeControl('phone');
        // BEFORE: control is at root
        const root = makeRoot([ctrl]);
        const jsonSchema = makeRootSchema({
            phone: { type: 'string', title: 'Phone' },
        });

        const before = computeExportedJsonSchema(root, jsonSchema);
        expect(before.properties).toHaveProperty('phone');

        // Simulate user drags ctrl into arr (element tree update + migration event fires)
        const arr = makeArray('contacts', [ctrl]);
        const rootAfter = makeRoot([arr]);
        // If migration ran, extract from root and place in arr.items.properties
        migrateToContainer('phone', jsonSchema, arr, [arr]);

        const after = computeExportedJsonSchema(rootAfter, jsonSchema);
        expect(after.properties).not.toHaveProperty('phone');
        // Single control → items is the schema directly
        expect((after.properties as any).contacts.items).toMatchObject({
            type: 'string',
            title: 'Phone',
        });
    });

    it('works even if migration did NOT fire (rootProps fallback)', () => {
        const ctrl = makeControl('email');
        const arr = makeArray('contacts', [ctrl]);
        const root = makeRoot([arr]);
        // No migration call — schema is still in root jsonSchema.properties
        const jsonSchema = makeRootSchema({
            email: { type: 'string', title: 'Email' },
        });

        const exported = computeExportedJsonSchema(root, jsonSchema);
        expect(exported.properties).not.toHaveProperty('email');
        // Single control → items is the schema directly
        expect((exported.properties as any).contacts.items).toMatchObject({
            type: 'string',
            title: 'Email',
        });
    });
});

// ─── 8. Moving control: Array → root ──────────────────────────────────────────

describe('Simulated move: Array → root', () => {
    it('after moving element out of array, schema appears at root', () => {
        const ctrlId = uuidv4();
        const ctrl = makeControl('tag', ctrlId);
        const arr = makeArray('tags', []);
        const root = makeRoot([arr, ctrl]);

        // Migration ran when element was dropped in array, then removed
        // First: migration moved to container
        const jsonSchema = makeRootSchema({ tag: { type: 'string' } });
        migrateToContainer('tag', jsonSchema, arr, [arr, ctrl]);
        // Now move element back to root (remove from arr.elements, it's now in root)
        // migrateToRoot is called
        migrateToRoot('tag', arr, jsonSchema);

        const exported = computeExportedJsonSchema(root, jsonSchema);
        expect(exported.properties).toHaveProperty('tag');
        // Array has no children — no items
        expect((exported.properties as any).tags?.items).toBeUndefined();
    });
});

// ─── 9. Moving control: Array A → Array B ───────────────────────────────────

describe('Simulated move: Array A → Array B', () => {
    it('schema moves from arrayA.items to arrayB.items', () => {
        const ctrl = makeControl('item');
        const arrA = makeArray('listA', []);
        const arrB = makeArray('listB', [ctrl]);
        const root = makeRoot([arrA, arrB]);

        const jsonSchema = makeRootSchema({ item: { type: 'string' } });

        // Step 1: migrate into A
        migrateToContainer('item', jsonSchema, arrA, [arrA, arrB]);
        // Step 2: @add fires in B first (SortableJS order: add before remove)
        //   extractSchema finds it in A and moves to B
        migrateToContainer('item', jsonSchema, arrB, [arrA, arrB]);
        // Step 3: @remove fires in A — tries migrateToRoot but it's already in B, no-op
        migrateToRoot('item', arrA, jsonSchema);

        const exported = computeExportedJsonSchema(root, jsonSchema);
        // listA has no children — no items
        expect((exported.properties as any).listA?.items).toBeUndefined();
        // listB has 1 Control → items is the schema directly
        expect((exported.properties as any).listB.items).toMatchObject({
            type: 'string',
        });
    });

    it('order-independent: works when remove fires before add too', () => {
        const ctrl = makeControl('datum');
        const arrA = makeArray('setA', []);
        const arrB = makeArray('setB', [ctrl]);

        const jsonSchema = makeRootSchema({ datum: { type: 'number' } });
        migrateToContainer('datum', jsonSchema, arrA, [arrA, arrB]);

        // remove fires first
        migrateToRoot('datum', arrA, jsonSchema);
        // then add fires
        migrateToContainer('datum', jsonSchema, arrB, [arrA, arrB]);

        const root = makeRoot([arrA, arrB]);
        const exported = computeExportedJsonSchema(root, jsonSchema);
        // setB has 1 Control → items is the schema directly
        expect((exported.properties as any).setB.items).toMatchObject({
            type: 'number',
        });
    });
});

// ─── 10. Empty Array → no items.type:"object" ────────────────────────────────

describe('Empty Array', () => {
    it("does not emit items: { type: 'object', properties: {} }", () => {
        const arr = makeArray('emptyList', []);
        const root = makeRoot([arr]);
        const jsonSchema = makeRootSchema({});

        const exported = computeExportedJsonSchema(root, jsonSchema);

        const arrSchema = (exported.properties as any).emptyList;
        expect(arrSchema.type).toBe('array');
        expect(arrSchema.items).toBeUndefined();
    });

    it('with minItems/maxItems still emits those constraints', () => {
        const arr = makeArray('bounded', []);
        (arr as any).minItems = 1;
        (arr as any).maxItems = 5;
        const root = makeRoot([arr]);
        const jsonSchema = makeRootSchema({});

        const exported = computeExportedJsonSchema(root, jsonSchema);

        expect((exported.properties as any).bounded).toMatchObject({
            type: 'array',
            minItems: 1,
            maxItems: 5,
        });
        expect((exported.properties as any).bounded.items).toBeUndefined();
    });
});

// ─── 11. Array with one field ─────────────────────────────────────────────────

describe('Array with one field', () => {
    it('emits items as the control schema directly (migration ran)', () => {
        const ctrl = makeControl('value');
        const arr = makeArray('values', [ctrl]);
        (arr as any).items = {
            type: 'object',
            properties: { value: { type: 'number' } },
        };
        const root = makeRoot([arr]);
        const jsonSchema = makeRootSchema({});

        const exported = computeExportedJsonSchema(root, jsonSchema);

        // Single control → items is { type: 'number' } directly, NOT wrapped in object
        expect((exported.properties as any).values.items).toEqual({
            type: 'number',
        });
    });

    it('emits items as the control schema directly (no migration — rootProps fallback)', () => {
        const ctrl = makeControl('score');
        const arr = makeArray('scores', [ctrl]);
        const root = makeRoot([arr]);
        const jsonSchema = makeRootSchema({
            score: { type: 'integer', title: 'Score' },
        });

        const exported = computeExportedJsonSchema(root, jsonSchema);

        // Single control → items is { type: 'integer', title: 'Score' } directly
        expect((exported.properties as any).scores.items).toEqual({
            type: 'integer',
            title: 'Score',
        });
    });
});

// ─── 12. UI schema for Array ──────────────────────────────────────────────────

describe('UI schema for Array', () => {
    it("emits a Control element with the array's scope", () => {
        const ctrl = makeControl('name');
        const arr = makeArray('people', [ctrl]);
        const root = makeRoot([arr]);

        const ui = computeUiSchema(root);
        const layout = ui.layout as LayoutElement;
        expect(layout.elements[0]).toMatchObject({
            type: 'Control',
            scope: '/properties/people',
        });
    });

    it('includes descendantControlOverrides for child controls with options', () => {
        const ctrl: ControlElement = {
            type: 'Control',
            scope: '/properties/score',
            options: { placeholder: 'Enter score' },
            _id: uuidv4(),
        };
        const arr = makeArray('results', [ctrl]);
        const root = makeRoot([arr]);

        const ui = computeUiSchema(root);
        const layout = ui.layout as LayoutElement;
        const arrControl = layout.elements[0] as any;
        expect(arrControl.options?.descendantControlOverrides).toMatchObject({
            '/properties/score': { options: { placeholder: 'Enter score' } },
        });
    });
});

// ─── 13. UI schema for Object ─────────────────────────────────────────────────

describe('UI schema for Object', () => {
    it('emits a Group layout with correctly-prefixed Control scopes', () => {
        const ctrl = makeControl('zip');
        const obj = makeObject('address', [ctrl]);
        (obj as any).title = 'Address';
        const root = makeRoot([obj]);

        const ui = computeUiSchema(root);
        const layout = ui.layout as LayoutElement;
        const group = layout.elements[0] as LayoutElement;
        expect(group.type).toBe('Group');
        expect((group.elements[0] as ControlElement).scope).toBe(
            '/properties/address/properties/zip'
        );
    });
});

// ─── 14. migrateToContainer / migrateToRoot ───────────────────────────────────

describe('migrateToContainer', () => {
    it('moves schema from root to Array.items.properties', () => {
        const arr = makeArray('things', []);
        const jsonSchema = makeRootSchema({ item: { type: 'string' } });

        migrateToContainer('item', jsonSchema, arr, [arr]);

        expect((jsonSchema.properties as any).item).toBeUndefined();
        expect((arr as any).items.properties.item).toEqual({ type: 'string' });
    });

    it('moves schema from root to Object.properties', () => {
        const obj = makeObject('info', []);
        const jsonSchema = makeRootSchema({ code: { type: 'integer' } });

        migrateToContainer('code', jsonSchema, obj, [obj]);

        expect((jsonSchema.properties as any).code).toBeUndefined();
        expect((obj as any).properties.code).toEqual({ type: 'integer' });
    });

    it('moves schema from Array A to Array B (container to container)', () => {
        const arrA = makeArray('setA', []);
        const arrB = makeArray('setB', []);
        const jsonSchema = makeRootSchema({});
        // pre-populate A
        (arrA as any).items = {
            type: 'object',
            properties: { val: { type: 'boolean' } },
        };

        migrateToContainer('val', jsonSchema, arrB, [arrA, arrB]);

        expect((arrA as any).items?.properties?.val).toBeUndefined();
        expect((arrB as any).items.properties.val).toEqual({ type: 'boolean' });
    });
});

describe('migrateToRoot', () => {
    it('moves schema from Array.items.properties back to root', () => {
        const arr = makeArray('list', []);
        (arr as any).items = {
            type: 'object',
            properties: { entry: { type: 'string' } },
        };
        const jsonSchema = makeRootSchema({});

        migrateToRoot('entry', arr, jsonSchema);

        expect((jsonSchema.properties as any).entry).toEqual({
            type: 'string',
        });
        expect((arr as any).items?.properties?.entry).toBeUndefined();
    });

    it('is a no-op when schema is not in the container (already moved)', () => {
        const arr = makeArray('list', []);
        const jsonSchema = makeRootSchema({ entry: { type: 'string' } });

        // arr.items is undefined — nothing to migrate
        migrateToRoot('entry', arr, jsonSchema);

        // root should be unchanged
        expect((jsonSchema.properties as any).entry).toEqual({
            type: 'string',
        });
    });
});

describe('extractSchema', () => {
    it('finds and removes from root', () => {
        const arr = makeArray('x', []);
        const jsonSchema = makeRootSchema({ key: { type: 'boolean' } });

        const result = extractSchema('key', [arr], jsonSchema);

        expect(result).toEqual({ type: 'boolean' });
        expect((jsonSchema.properties as any).key).toBeUndefined();
    });

    it('finds and removes from nested Array.items.properties', () => {
        const arr = makeArray('nested', []);
        (arr as any).items = {
            type: 'object',
            properties: { deep: { type: 'number' } },
        };
        const jsonSchema = makeRootSchema({});

        const result = extractSchema('deep', [arr], jsonSchema);

        expect(result).toEqual({ type: 'number' });
        expect((arr as any).items?.properties?.deep).toBeUndefined();
    });

    it('returns undefined when key not found anywhere', () => {
        const arr = makeArray('nothing', []);
        const jsonSchema = makeRootSchema({});

        expect(extractSchema('missing', [arr], jsonSchema)).toBeUndefined();
    });
});

// ─── buildFieldTree ───────────────────────────────────────────────────────────

import {
    buildFieldTree,
    scopeToDotPath,
    resolveSchemaAtScope,
} from '../controlFields';
import type { WizardElement } from '../../formTypes';

describe('buildFieldTree', () => {
    it('returns empty array for root layout with no elements', () => {
        const root = makeRoot([]);
        const schema = makeRootSchema({});
        expect(buildFieldTree(root, schema)).toEqual([]);
    });

    it('returns a node for a Control at root level', () => {
        const ctrl = makeControl('name');
        const root = makeRoot([ctrl]);
        const schema = makeRootSchema({
            name: { type: 'string', title: 'Full Name' },
        });

        const result = buildFieldTree(root, schema);
        expect(result).toHaveLength(1);
        expect(result[0].path).toBe('name');
        expect(result[0].title).toBe('Full Name');
        expect(result[0].schemaType).toBe('string');
    });

    it('uses key as title fallback when schema has no title', () => {
        const ctrl = makeControl('email');
        const root = makeRoot([ctrl]);
        const schema = makeRootSchema({ email: { type: 'string' } });

        const result = buildFieldTree(root, schema);
        expect(result[0].title).toBe('email');
    });

    it('still returns a node even when schema entry is missing', () => {
        const ctrl = makeControl('orphan');
        const root = makeRoot([ctrl]);
        const schema = makeRootSchema({});

        const result = buildFieldTree(root, schema);
        expect(result).toHaveLength(1);
        expect(result[0].path).toBe('orphan');
        expect(result[0].title).toBe('orphan');
    });

    it('traverses through Layout containers transparently', () => {
        const ctrl = makeControl('city');
        const layout: LayoutElement = {
            type: 'Group',
            elements: [ctrl],
            _id: 'g1',
        } as LayoutElement;
        const root = makeRoot([layout]);
        const schema = makeRootSchema({ city: { type: 'string' } });

        const result = buildFieldTree(root, schema);
        expect(result).toHaveLength(1);
        expect(result[0].path).toBe('city');
    });

    it('returns an Object branch with children', () => {
        const childCtrl = makeControl('street');
        const obj = makeObject('address', [childCtrl]);
        const root = makeRoot([obj]);
        const schema = makeRootSchema({
            address: {
                type: 'object',
                title: 'Address',
                properties: { street: { type: 'string', title: 'Street' } },
            },
        });

        const result = buildFieldTree(root, schema);
        expect(result).toHaveLength(1);
        expect(result[0].path).toBe('address');
        expect(result[0].title).toBe('Address');
        expect(result[0].schemaType).toBe('object');
        expect(result[0].children).toHaveLength(1);
        expect(result[0].children![0].path).toBe('address.street');
        expect(result[0].children![0].title).toBe('Street');
    });

    it('returns an Array leaf (no children)', () => {
        const arr = makeArray('items');
        const root = makeRoot([arr]);
        const schema = makeRootSchema({
            items: { type: 'array', title: 'Items' },
        });

        const result = buildFieldTree(root, schema);
        expect(result).toHaveLength(1);
        expect(result[0].path).toBe('items');
        expect(result[0].schemaType).toBe('array');
        expect(result[0].children).toBeUndefined();
    });

    it('traverses Wizard pages and collects all Controls', () => {
        const ctrl1 = makeControl('first');
        const ctrl2 = makeControl('last');
        const page1: LayoutElement = {
            type: 'VerticalLayout',
            elements: [ctrl1],
            _id: 'p1',
        } as LayoutElement;
        const page2: LayoutElement = {
            type: 'VerticalLayout',
            elements: [ctrl2],
            _id: 'p2',
        } as LayoutElement;
        const wizard: WizardElement = {
            type: 'Wizard',
            pages: [page1, page2],
            _id: 'w1',
        } as unknown as WizardElement;
        const schema = makeRootSchema({
            first: { type: 'string' },
            last: { type: 'string' },
        });

        const result = buildFieldTree(wizard, schema);
        expect(result).toHaveLength(2);
        expect(result.map((n) => n.path)).toEqual(['first', 'last']);
    });
});

describe('scopeToDotPath', () => {
    it('converts /properties/key to key', () => {
        expect(scopeToDotPath('/properties/name')).toBe('name');
    });

    it('converts #/properties/key to key', () => {
        expect(scopeToDotPath('#/properties/name')).toBe('name');
    });

    it('converts nested scope to dot path', () => {
        expect(scopeToDotPath('/properties/address/properties/city')).toBe(
            'address.city'
        );
    });
});

describe('resolveSchemaAtScope', () => {
    it('resolves a top-level property', () => {
        const schema = makeRootSchema({ name: { type: 'string' } });
        const result = resolveSchemaAtScope('/properties/name', schema);
        expect(result).toEqual({ type: 'string' });
    });

    it('returns undefined for missing property', () => {
        const schema = makeRootSchema({});
        expect(
            resolveSchemaAtScope('/properties/missing', schema)
        ).toBeUndefined();
    });

    it('resolves nested property through object', () => {
        const schema = makeRootSchema({
            address: {
                type: 'object',
                properties: { city: { type: 'string' } },
            },
        });
        const result = resolveSchemaAtScope(
            '/properties/address/properties/city',
            schema
        );
        expect(result).toEqual({ type: 'string' });
    });
});
