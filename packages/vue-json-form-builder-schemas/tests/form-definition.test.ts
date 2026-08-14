import { describe, expect, it } from 'vitest';
import {
    ArrayElement,
    ObjectElement,
    StringElement,
    NumberElement,
    Form,
    FormDefinition,
    Dependency,
    DependencyGroup,
    DependencyType,
    DependencyRelation,
    fromJSON,
    fromJsonSchemaAndUiSchema,
    SchemaGenerator,
} from '../schemas/index';

/** Build a small but representative form tree. */
function buildSampleForm(): FormDefinition {
    const stringElement = new StringElement({ id: 'name', title: 'Name' });
    const numberElement = new NumberElement({
        id: 'age',
        title: 'Age',
        required: true,
        format: 'integer',
    });
    const innerObject = new ObjectElement({ id: 'address', title: 'Address' });
    const street = new StringElement({ id: 'street', title: 'Street' });
    innerObject.data.children = [street.uid];

    const array = new ArrayElement({
        id: 'hobbies',
        title: 'Hobbies',
        required: true,
    });
    const hobby = new StringElement({ id: 'hobby', title: 'Hobby' });
    array.data.children = [hobby.uid];

    const root = new Form({
        id: 'my_form',
        title: 'My Form',
        children: [
            stringElement.uid,
            numberElement.uid,
            innerObject.uid,
            array.uid,
        ],
    });

    return new FormDefinition(root, [
        stringElement,
        numberElement,
        innerObject,
        street,
        array,
        hobby,
    ]);
}

/**
 * Sample form with a dependency tree (attached to the street element):
 *
 *   group "dep_street" (AND)
 *   ├── dep "dep_age"   (age greaterThan 18)
 *   └── group "dep_street_alt" (OR)
 *       └── dep "dep_name" (name isNotEmpty)
 */
function buildFormWithDependencies(): FormDefinition {
    const form = buildSampleForm();
    const street = form.getElementById(form.root.children[2]) as ObjectElement;
    const streetChildUid = street.children[0];

    const depAge = new Dependency({
        id: 'dep_age',
        sourceId: 'age',
        dependencyType: DependencyType.greaterThan,
        value: 18,
    });
    const nested = new DependencyGroup({
        id: 'dep_street_alt',
        dependencies: [],
        relation: DependencyRelation.OR,
    });
    const depName = new Dependency({
        id: 'dep_name',
        sourceId: 'name',
        dependencyType: DependencyType.isNotEmpty,
        value: true,
    });
    nested.data.dependencies = [depName.uid];

    const group = new DependencyGroup({
        id: 'dep_street',
        dependencies: [depAge.uid, nested.uid],
        relation: DependencyRelation.AND,
    });

    // dependency entities are indexed like elements — the constructor takes
    // the whole flat set, then derives the dependency tree from the uid lists
    const full = new FormDefinition(
        form.root,
        Array.from(form.nodesIndex.values()),
        [group, nested, depAge, depName]
    );
    full.setDependency(full.getElementById(streetChildUid)!, group);
    return full;
}

describe('FormDefinition', () => {
    it('serializes and deserializes without data loss', () => {
        const original = buildSampleForm();
        const restored = fromJSON(JSON.stringify(original.toJSON()));

        expect(restored.toJSON()).toEqual(original.toJSON());
        expect(restored.root.title).toBe('My Form');
        expect(restored.root.children).toHaveLength(4);
    });

    it('accepts a plain object as input to fromJSON', () => {
        const original = buildSampleForm();
        const restored = fromJSON(original.toJSON());
        expect(restored.toJSON()).toEqual(original.toJSON());
    });

    it('rejects corrupt element data', () => {
        const original = buildSampleForm();
        const json = original.toJSON() as any;
        delete json.elements[json.root.children[0]].data.title;
        expect(() => fromJSON(json)).toThrow();
    });

    it('resolves parents and children through the indexes', () => {
        const form = buildSampleForm();
        const array = form.getElementById(
            form.root.children[3]
        ) as ArrayElement;
        expect(array).toBeInstanceOf(ArrayElement);
        const hobby = form.getElementById(array.data.children[0]);
        expect(hobby).toBeDefined();
        expect(form.getParentId(hobby!.uid)).toBe(array.uid);
        expect(form.getParent(hobby!.uid)).toBe(array);
    });

    it('preserves element order through the children arrays', () => {
        const form = buildSampleForm();
        const ids = form.root.children.map(
            (uid) => form.getElementById(uid)!.id
        );
        expect(ids).toEqual(['name', 'age', 'address', 'hobbies']);
    });

    it('moves an element between containers', () => {
        const form = buildSampleForm();
        const nameElement = form.getElementById(form.root.children[0])!;
        const target = form.getElementById(
            form.root.children[2]
        ) as ObjectElement;

        form.moveElement(nameElement.uid, target, 0);

        expect(target.children).toContain(nameElement.uid);
        expect(form.root.children).not.toContain(nameElement.uid);
        expect(form.getParentId(nameElement.uid)).toBe(target.uid);
    });

    it('reorders an element within the same parent', () => {
        const form = buildSampleForm();
        const first = form.root.children[0];

        form.moveElement(first, form.root, 2);

        expect(form.root.children[2]).toBe(first);
        expect(form.root.children).toHaveLength(4);
        expect(new Set(form.root.children).size).toBe(4); // no duplicates
    });

    it('deletes an element including its subtree', () => {
        const form = buildSampleForm();
        const array = form.getElementById(
            form.root.children[3]
        ) as ArrayElement;
        const hobbyUid = array.children[0];

        form.deleteElement(array.uid);

        expect(form.getElementById(array.uid)).toBeUndefined();
        expect(form.getElementById(hobbyUid)).toBeUndefined();
        expect(form.root.children).not.toContain(array.uid);
    });

    it('updates element data', () => {
        const form = buildSampleForm();
        const nameElement = form.getElementById(form.root.children[0])!;
        form.updateElement(nameElement, { title: 'Full name' });
        expect(
            (form.getElementById(nameElement.uid) as StringElement).data.title
        ).toBe('Full name');
    });
});

describe('Dependency groups', () => {
    it('indexes dependency groups like elements (flat set + tree)', () => {
        const form = buildFormWithDependencies();
        const street = form.getElementById(
            form.root.children[2]
        ) as ObjectElement;
        const streetChildUid = street.children[0];

        const group = form.getDependencyGroupById(
            form.getElementById(streetChildUid)!.data.dependencyGroup!
        )!;
        expect(group).toBeDefined();
        expect(form.getElementById(streetChildUid)!.data.dependencyGroup).toBe(
            group.uid
        );
        expect(form.dependencyIndex.has(group.uid)).toBe(true);
        expect(form.getDependencyGroupById(group.uid)).toBe(group);

        // nested group + plain dependency are part of the flat set with a
        // parent link to the group
        const [depAgeUid, nestedUid] = group.data.dependencies;
        expect(form.dependencyIndex.has(nestedUid)).toBe(true);
        expect(form.getDependencyParentId(nestedUid)).toBe(group.uid);
        expect(form.getDependencyParent(nestedUid)).toBe(group);
        expect(form.dependencyIndex.has(depAgeUid)).toBe(true);
        expect(form.getDependencyParentId(depAgeUid)).toBe(group.uid);

        // elementDependencyGraph: source element → dependencies
        expect(form.getDependenciesElementIsSourceFor('age')).toContain(
            depAgeUid
        );
        expect(form.getDependenciesElementIsSourceFor('name')).toContain(
            form.getDependencyGroupById(nestedUid)!.data.dependencies[0]
        );

        // parent of a dependency group can be an element or a group
        expect(form.getParentOfDependency_Group(group.uid)).toBe(
            form.getElementById(streetChildUid)
        );
        expect(form.getParentOfDependency_Group(nestedUid)).toBe(group);
    });

    it('round-trips dependency groups through serialization', () => {
        const original = buildFormWithDependencies();
        const restored = fromJSON(JSON.stringify(original.toJSON()));

        expect(restored.toJSON()).toEqual(original.toJSON());
        expect(restored.dependencyIndex.size).toBe(4);
        expect(restored.dependencyParentIndex.size).toBe(4);
        // element → group link survives
        const street = restored.getElementById(
            restored.root.children[2]
        ) as ObjectElement;
        const streetChildUid = street.children[0];
        expect(
            restored.getElementById(streetChildUid)!.data.dependencyGroup
        ).toBeDefined();
        expect(
            restored.getDependencyGroupById(
                restored.getElementById(streetChildUid)!.data.dependencyGroup!
            )
        ).toBeDefined();
    });

    it('deleting an element cascade-deletes its dependency group subtree', () => {
        const form = buildFormWithDependencies();
        const street = form.getElementById(
            form.root.children[2]
        ) as ObjectElement;
        const streetChildUid = street.children[0];
        const group = form.getDependencyGroupById(
            form.getElementById(streetChildUid)!.data.dependencyGroup!
        )!;
        const [depAgeUid, nestedUid] = group.data.dependencies;

        form.deleteElement(streetChildUid);

        expect(form.dependencyIndex.has(group.uid)).toBe(false);
        expect(form.dependencyIndex.has(nestedUid)).toBe(false);
        expect(form.dependencyIndex.has(depAgeUid)).toBe(false);
        expect(form.dependencyParentIndex.has(nestedUid)).toBe(false);
        expect(form.dependencyParentIndex.has(depAgeUid)).toBe(false);
        expect(form.getElementById(streetChildUid)).toBeUndefined();
    });

    it('detaches a dependency group with setDependency(undefined)', () => {
        const form = buildFormWithDependencies();
        const street = form.getElementById(
            form.root.children[2]
        ) as ObjectElement;
        const streetChildUid = street.children[0];
        const element = form.getElementById(streetChildUid)!;
        const group = form.getDependencyGroupById(
            element.data.dependencyGroup!
        )!;

        form.setDependency(element, undefined);

        expect(element.data.dependencyGroup).toBeUndefined();
        expect(form.dependencyParentIndex.has(group.uid)).toBe(false);
        // the group entity itself stays indexed (it is a first-class entity)
        expect(form.dependencyIndex.has(group.uid)).toBe(true);
    });

    it('adds and deletes dependency entities through the indexes', () => {
        const form = buildFormWithDependencies();
        const street = form.getElementById(
            form.root.children[2]
        ) as ObjectElement;
        const streetChildUid = street.children[0];
        const group = form.getDependencyGroupById(
            form.getElementById(streetChildUid)!.data.dependencyGroup!
        )!;

        const newDep = new Dependency({
            id: 'dep_age2',
            sourceId: 'age',
            dependencyType: DependencyType.lessThan,
            value: 10,
        });
        form.addDependencyToGroup(newDep, group.uid);
        expect(group.dependencies).toContain(newDep.uid);
        expect(form.getDependencyParentId(newDep.uid)).toBe(group.uid);
        expect(form.getDependenciesElementIsSourceFor('age')).toContain(
            newDep.uid
        );

        form.deleteDependency_Group(newDep.uid);
        expect(group.dependencies).not.toContain(newDep.uid);
        expect(form.dependencyIndex.has(newDep.uid)).toBe(false);
    });
});

describe('Schema generation', () => {
    it('generates JSON Schema and UI Schema from the tree', () => {
        const form = buildSampleForm();
        const generator = new SchemaGenerator(form);
        const jsonSchema = form.root.toJsonSchema(generator, ['properties']);
        const uiSchema = form.root.toUiSchema(generator);

        expect(jsonSchema.type).toBe('object');
        expect(Object.keys((jsonSchema as any).properties)).toHaveLength(4);
        expect((jsonSchema as any).required).toContain(
            form.getElementById(form.root.children[1])!.id // Age is required
        );
        expect((uiSchema as any).layout.type).toBe('VerticalLayout');
        expect((uiSchema as any).layout.elements).toHaveLength(4);
    });
});

describe('Import from {json, ui} schema pair', () => {
    it('rebuilds a FormDefinition from exported schemas', () => {
        const jsonSchema = {
            type: 'object',
            title: 'My Form',
            properties: {
                Name: { type: 'string', title: 'Name' },
                Age: { type: 'integer', title: 'Age' },
            },
            required: ['Name'],
        };
        const uiSchema = {
            version: '2.0',
            layout: {
                type: 'VerticalLayout',
                elements: [
                    { type: 'Control', scope: '#/properties/Name' },
                    { type: 'Control', scope: '#/properties/Age' },
                ],
            },
        };

        const form = fromJsonSchemaAndUiSchema(
            jsonSchema as any,
            uiSchema as any
        );

        expect(form.root.title).toBe('My Form');
        expect(form.root.children).toHaveLength(2);
        const name = form.getElementById(form.root.children[0])!;
        expect(name).toBeInstanceOf(StringElement);
        // the property key becomes the element id
        expect(name.id).toBe('Name');
        expect((name as StringElement).data.required).toBe(true);

        const age = form.getElementById(form.root.children[1])!;
        expect(age).toBeInstanceOf(NumberElement);
        expect((age as NumberElement).data.format).toBe('integer');
    });

    it('round-trips nested array/object containers without shared children (regression: RangeError cycle)', () => {
        // Build a form with a nested array-of-objects and export it
        const root = new Form({ id: 'form', title: 'My Form' });
        const arrayEl = new ArrayElement({
            id: 'tags',
            title: 'Tags',
            layout: 'VerticalLayout',
            children: [],
        });
        const stringEl = new StringElement({ id: 'tag', title: 'Tag' });
        arrayEl.data.children.push(stringEl.uid);
        root.children.push(arrayEl.uid);

        const fd = new FormDefinition(root, [arrayEl, stringEl]);
        const generator = new SchemaGenerator(fd);
        const jsonSchema = fd.root.toJsonSchema(generator, ['properties']);
        const uiSchema = fd.root.toUiSchema(generator);

        // Re-importing must not create a cycle (the old shared-default-array
        // bug made every container point at the same children array, which
        // ended up containing the container's own uid → infinite recursion)
        const imported = fromJsonSchemaAndUiSchema(jsonSchema, uiSchema);

        // each container must have its own children array
        const importedArray = imported.getElementById(
            imported.root.children[0]
        ) as ArrayElement;
        expect(importedArray).toBeInstanceOf(ArrayElement);
        expect(importedArray.children).toHaveLength(1);
        const item = imported.getElementById(importedArray.children[0])!;
        expect(item).toBeInstanceOf(ObjectElement);
        expect((item as ObjectElement).children).not.toContain(item.uid);
        expect((item as ObjectElement).children).not.toBe(
            importedArray.children
        );
    });

    it('containers created without explicit children never share an array', () => {
        const a = new ObjectElement({ id: 'a' });
        const b = new ArrayElement({ id: 'b', layout: 'VerticalLayout' });
        const c = new Form({ id: 'c', title: 'C' });
        expect(a.children).not.toBe(b.children);
        expect(a.children).not.toBe(c.children);
        // mutating one must not affect the others
        a.data.children.push('some-uid');
        expect(b.children).toHaveLength(0);
        expect(c.children).toHaveLength(0);
    });
});
