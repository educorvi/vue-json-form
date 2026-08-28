import { describe, it, expect } from 'vitest';
import { createFormBuilder } from '../../src/useFormBuilder';
import { ContainerElement } from '@educorvi/vue-json-forms-builder-schemas';

/**
 * exercises "add element" / "move element" / "delete element" through the same store API the UI's drag-and-drop
 * handlers call (see CanvasNode.vue / DropZone.vue), plus schema generation and json/ui schema import. This is the store-level
 * counterpart to tests/component/App.test.ts's black-box prop/event assertions.
 */
describe('form builder engine (local mode)', () => {
    it('starts with an empty root form', () => {
        const builder = createFormBuilder();
        expect(builder.formDefinition.value).not.toBeNull();
        expect(builder.formDefinition.value!.root.children).toHaveLength(0);
        builder.dispose();
    });

    it('adds an element to the root container', () => {
        const builder = createFormBuilder();
        const rootUid = builder.formDefinition.value!.root.uid;

        const added = builder.addElement(rootUid, 'text');

        expect(added).toBeDefined();
        expect(builder.formDefinition.value!.root.children).toEqual([
            added!.uid,
        ]);
        // The tree is rebuilt fresh from the Y.Doc on every change (see
        // useFormBuilder.ts's `rebuild`), so the resolved element is a new
        // instance with the same uid/content, not the same object reference.
        expect(
            builder.formDefinition.value!.getElementById(added!.uid)?.uid
        ).toBe(added!.uid);
        builder.dispose();
    });

    it('moves an element into a container', () => {
        const builder = createFormBuilder();
        const rootUid = builder.formDefinition.value!.root.uid;
        const container = builder.addElement(rootUid, 'object')!;
        const field = builder.addElement(rootUid, 'text')!;
        expect(builder.formDefinition.value!.root.children).toHaveLength(2);

        builder.moveElement(field.uid, container.uid);

        // only the container is left directly under the root...
        expect(builder.formDefinition.value!.root.children).toEqual([
            container.uid,
        ]);
        // ...and the field now lives inside it
        const containerAfter = builder.formDefinition.value!.getElementById(
            container.uid
        );
        expect(containerAfter).toBeInstanceOf(ContainerElement);
        expect((containerAfter as ContainerElement).children).toEqual([
            field.uid,
        ]);
        expect(builder.formDefinition.value!.getParentId(field.uid)).toBe(
            container.uid
        );
        builder.dispose();
    });

    it('deletes an element', () => {
        const builder = createFormBuilder();
        const rootUid = builder.formDefinition.value!.root.uid;
        const field = builder.addElement(rootUid, 'text')!;

        builder.deleteElement(field.uid);

        expect(builder.formDefinition.value!.root.children).toHaveLength(0);
        expect(
            builder.formDefinition.value!.getElementById(field.uid)
        ).toBeUndefined();
        builder.dispose();
    });

    it('reflects a field update in the generated schemas', () => {
        const builder = createFormBuilder();
        const rootUid = builder.formDefinition.value!.root.uid;
        const field = builder.addElement(rootUid, 'text')!;

        builder.updateElementField(field.uid, 'title', 'Full name');

        const schemas = builder.generateSchemas();
        expect(schemas).not.toBeNull();
        // 'title' surfaces on the generated JSON Schema property (see
        // BaseDataElement.toJsonSchema in the schemas package).
        expect(JSON.stringify(schemas!.jsonSchema)).toContain('Full name');
        builder.dispose();
    });

    it('imports a json/ui schema pair and exports it back out', () => {
        const builder = createFormBuilder();
        const jsonSchema = {
            type: 'object',
            properties: { name: { type: 'string', title: 'Name' } },
            required: ['name'],
        };
        const uiSchema = {
            version: '2.0',
            layout: {
                type: 'VerticalLayout',
                elements: [{ type: 'Control', scope: '#/properties/name' }],
            },
        };

        builder.loadFromJsonUi(jsonSchema, uiSchema);

        expect(builder.formDefinition.value!.root.children).toHaveLength(1);

        const exported = builder.generateSchemas();
        expect(exported).not.toBeNull();
        expect(exported!.jsonSchema).toMatchObject({
            type: 'object',
            properties: { name: { type: 'string' } },
        });
        builder.dispose();
    });
});
