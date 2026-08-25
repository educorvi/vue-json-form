import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import {
    ArrayElement,
    ObjectElement,
    StringElement,
    Form,
    FormDefinition,
    DependencyGroup,
    DependencyType,
    DependencyRelation,
} from '../schemas/index';
import {
    addElement,
    addDependencyGroup,
    deleteElement,
    deleteDependencyGroup,
    formDefinitionToYDoc,
    yDocToFormDefinition,
    updateElementField,
    updateDependencyGroupField,
    setElementDependency,
    moveElement,
} from '../schemas/collab/index';
import {
    setPresenceUser,
    setSelectedElement,
    setEditingField,
    getRemotePresenceStates,
    getRemotePresences,
    getConnectedUsers,
    colorForUser,
    OWN_USER_COLOR,
} from '../schemas/collab/index';

function buildSampleForm(): FormDefinition {
    const stringElement = new StringElement({ id: 'name', title: 'Name' });
    const innerObject = new ObjectElement({ id: 'address', title: 'Address' });
    const street = new StringElement({ id: 'street', title: 'Street' });
    innerObject.data.children = [street.uid];

    const root = new Form({
        id: 'my_form',
        title: 'My Form',
        children: [stringElement.uid, innerObject.uid],
    });

    return new FormDefinition(root, [stringElement, innerObject, street]);
}

function buildSampleDependencyGroup(): DependencyGroup {
    return new DependencyGroup({
        id: 'dep_street',
        dependencies: [],
        relation: DependencyRelation.AND,
    });
}

describe('yjs-adapter', () => {
    it('round-trips a FormDefinition through a Y.Doc', () => {
        const original = buildSampleForm();
        const doc = formDefinitionToYDoc(original);
        const restored = yDocToFormDefinition(doc);

        expect(restored.toJSON()).toEqual(original.toJSON());
    });

    it('stores container children as Y.Array (order-preserving)', () => {
        const original = buildSampleForm();
        const doc = formDefinitionToYDoc(original);
        const rootChildren = doc.getMap('root').get('children');
        expect(rootChildren).toBeInstanceOf(Y.Array);

        const elements = doc.getMap('elements');
        const objectMap = elements.get(original.root.children[1]);
        expect(objectMap).toBeInstanceOf(Y.Map);
        expect(objectMap.get('children')).toBeInstanceOf(Y.Array);
    });

    it('adds elements through the document', () => {
        const original = buildSampleForm();
        const doc = formDefinitionToYDoc(original);

        const email = new StringElement({ id: 'email', title: 'Email' });
        addElement(doc, original.root.uid, email, 1);

        const restored = yDocToFormDefinition(doc);
        expect(restored.root.children).toHaveLength(3);
        expect(restored.root.children[1]).toBe(email.uid);
        expect(restored.getElementById(email.uid)?.data.title).toBe('Email');
    });

    it('updates a single field', () => {
        const original = buildSampleForm();
        const doc = formDefinitionToYDoc(original);
        const uid = original.root.children[0];

        updateElementField(doc, uid, 'title', 'Full name');

        const restored = yDocToFormDefinition(doc);
        expect(restored.getElementById(uid)?.data.title).toBe('Full name');
    });

    it('moves an element between containers', () => {
        const original = buildSampleForm();
        const doc = formDefinitionToYDoc(original);
        const nameUid = original.root.children[0];
        const targetUid = original.root.children[1];

        moveElement(doc, nameUid, targetUid, 0);

        const restored = yDocToFormDefinition(doc);
        const target = restored.getElementById(targetUid) as ObjectElement;
        expect(target.children).toContain(nameUid);
        expect(restored.root.children).not.toContain(nameUid);
        expect(restored.getParentId(nameUid)).toBe(targetUid);
    });

    it('reorders an element within the same parent (order is synced)', () => {
        const original = buildSampleForm();
        const doc = formDefinitionToYDoc(original);
        const nameUid = original.root.children[0];

        moveElement(doc, nameUid, original.root.uid, 1);

        const restored = yDocToFormDefinition(doc);
        expect(restored.root.children[1]).toBe(nameUid);
        expect(restored.root.children).toHaveLength(2);
        expect(new Set(restored.root.children).size).toBe(2); // no duplicates
    });

    it('deletes an element including its subtree', () => {
        const original = buildSampleForm();
        const doc = formDefinitionToYDoc(original);
        const objectUid = original.root.children[1];
        const streetUid = (original.getElementById(objectUid) as ObjectElement)
            .children[0];

        deleteElement(doc, objectUid);

        const restored = yDocToFormDefinition(doc);
        expect(restored.getElementById(objectUid)).toBeUndefined();
        expect(restored.getElementById(streetUid)).toBeUndefined();
        expect(restored.root.children).not.toContain(objectUid);
    });
});

describe('yjs dependency groups', () => {
    it('round-trips dependency groups through a Y.Doc', () => {
        const original = buildSampleForm();
        const group = buildSampleDependencyGroup();
        const nameUid = original.root.children[0];
        // attach the group via the yjs adapter — the single mutation interface
        const doc = formDefinitionToYDoc(original);
        addDependencyGroup(doc, group);
        setElementDependency(doc, nameUid, group.uid);

        const restored = yDocToFormDefinition(doc);

        expect(restored.dependencyIndex.size).toBe(1);
        expect(
            restored.getDependencyGroupById(
                restored.getElementById(nameUid)!.data.dependencyGroup!
            )
        ).toBeDefined();
        expect(restored.getElementById(nameUid)!.data.dependencyGroup).toBe(
            group.uid
        );
        // hydrating back into a fresh doc preserves the whole definition
        const roundTripped = yDocToFormDefinition(formDefinitionToYDoc(restored));
        expect(roundTripped.toJSON()).toEqual(restored.toJSON());
    });

    it('adds a dependency group and attaches it to an element', () => {
        const original = buildSampleForm();
        const doc = formDefinitionToYDoc(original);
        const nameUid = original.root.children[0];

        const group = buildSampleDependencyGroup();
        addDependencyGroup(doc, group);
        setElementDependency(doc, nameUid, group.uid);

        const restored = yDocToFormDefinition(doc);
        expect(restored.dependencyIndex.size).toBe(1);
        expect(restored.getElementById(nameUid)!.data.dependencyGroup).toBe(
            group.uid
        );
        expect(
            restored.getDependencyGroupById(
                restored.getElementById(nameUid)!.data.dependencyGroup!
            )!.uid
        ).toBe(group.uid);
        // the group's parent is the element it is attached to
        expect(restored.getParentOfDependency_Group(group.uid)).toBe(
            restored.getElementById(nameUid)
        );
    });

    it('nests a group under a parent via dependencies (Y.Array)', () => {
        const original = buildSampleForm();
        const doc = formDefinitionToYDoc(original);

        const parent = buildSampleDependencyGroup();
        addDependencyGroup(doc, parent);
        const nested = new DependencyGroup({
            id: 'dep_nested',
            dependencies: [],
            relation: DependencyRelation.OR,
        });
        addDependencyGroup(doc, nested, parent.uid);

        const dependencies = doc.getMap('dependencies').get(parent.uid);
        expect(dependencies).toBeInstanceOf(Y.Map);
        expect(
            (dependencies as Y.Map<unknown>).get('dependencies')
        ).toBeInstanceOf(Y.Array);

        const restored = yDocToFormDefinition(doc);
        expect(restored.dependencyIndex.size).toBe(2);
        expect(restored.dependencyParentIndex.get(nested.uid)).toBe(parent.uid);
        expect(restored.getDependencyParent(nested.uid)).toBe(
            restored.getDependencyGroupById(parent.uid)
        );
    });

    it('updates a dependency group field', () => {
        const original = buildSampleForm();
        const doc = formDefinitionToYDoc(original);
        const group = buildSampleDependencyGroup();
        addDependencyGroup(doc, group);

        updateDependencyGroupField(
            doc,
            group.uid,
            'relation',
            DependencyRelation.OR
        );

        const restored = yDocToFormDefinition(doc);
        expect(restored.dependencyIndex.get(group.uid)!.relation).toBe(
            DependencyRelation.OR
        );
    });

    it('detaches the dependency reference from an element', () => {
        const original = buildSampleForm();
        const doc = formDefinitionToYDoc(original);
        const nameUid = original.root.children[0];
        const group = buildSampleDependencyGroup();
        addDependencyGroup(doc, group);
        setElementDependency(doc, nameUid, group.uid);

        setElementDependency(doc, nameUid, undefined);

        const restored = yDocToFormDefinition(doc);
        expect(
            restored.getElementById(nameUid)!.data.dependencyGroup
        ).toBeUndefined();
        expect(restored.dependencyParentIndex.has(group.uid)).toBe(false);
        // the group entity itself stays in the document
        expect(restored.dependencyIndex.has(group.uid)).toBe(true);
    });

    it('deleting an element cascade-deletes its dependency group subtree', () => {
        const original = buildSampleForm();
        const doc = formDefinitionToYDoc(original);
        const nameUid = original.root.children[0];

        const group = buildSampleDependencyGroup();
        addDependencyGroup(doc, group);
        const nested = new DependencyGroup({
            id: 'dep_nested',
            dependencies: [],
            relation: DependencyRelation.OR,
        });
        addDependencyGroup(doc, nested, group.uid);
        setElementDependency(doc, nameUid, group.uid);

        deleteElement(doc, nameUid);

        const restored = yDocToFormDefinition(doc);
        expect(restored.dependencyIndex.size).toBe(0);
        expect(restored.getElementById(nameUid)).toBeUndefined();
    });

    it('deleteDependencyGroup removes the subtree and clears references', () => {
        const original = buildSampleForm();
        const doc = formDefinitionToYDoc(original);
        const nameUid = original.root.children[0];

        const group = buildSampleDependencyGroup();
        addDependencyGroup(doc, group);
        const nested = new DependencyGroup({
            id: 'dep_nested',
            dependencies: [],
            relation: DependencyRelation.OR,
        });
        addDependencyGroup(doc, nested, group.uid);
        setElementDependency(doc, nameUid, group.uid);

        deleteDependencyGroup(doc, group.uid);

        const restored = yDocToFormDefinition(doc);
        expect(restored.dependencyIndex.size).toBe(0);
        expect(
            restored.getElementById(nameUid)!.data.dependencyGroup
        ).toBeUndefined();
        expect(restored.dependencyParentIndex.has(group.uid)).toBe(false);
    });
});

describe('yjs collaboration convergence', () => {
    it('two clients editing concurrently converge to the same document', () => {
        // Both clients start from the persisted form
        const docA = formDefinitionToYDoc(buildSampleForm());
        const docB = new Y.Doc();
        Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));

        const nameUid = yDocToFormDefinition(docA).root.children[0];

        // Client A: add a new element; Client B: rename an existing one
        addElement(
            docA,
            yDocToFormDefinition(docA).root.uid,
            new StringElement({ id: 'email', title: 'Email' })
        );
        updateElementField(docB, nameUid, 'title', 'Full name');

        // Exchange updates (what y-websocket/hocuspocus does over the wire)
        Y.applyUpdate(docA, Y.encodeStateAsUpdate(docB));
        Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));

        const finalA = yDocToFormDefinition(docA);
        const finalB = yDocToFormDefinition(docB);

        // Both clients converged to the identical form
        expect(finalA.toJSON()).toEqual(finalB.toJSON());
        expect(finalA.getElementById(nameUid)?.data.title).toBe('Full name');
        expect(finalA.root.children.some((uid) => uid !== nameUid)).toBe(true);
    });

    it('two clients renaming siblings to the same name converge with unique names', () => {
        const a = new StringElement({ id: 'name', title: 'Name' });
        const b = new StringElement({ id: 'email', title: 'Email' });
        const root = new Form({
            id: 'f',
            title: 'Form',
            children: [a.uid, b.uid],
        });
        const docA = formDefinitionToYDoc(new FormDefinition(root, [a, b]));
        const docB = new Y.Doc();
        Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));

        // Client A renames "name" → "username", client B renames "email" → "username"
        updateElementField(docA, a.uid, 'id', 'username');
        updateElementField(docB, b.uid, 'id', 'username');

        Y.applyUpdate(docA, Y.encodeStateAsUpdate(docB));
        Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));

        const finalA = yDocToFormDefinition(docA);
        const finalB = yDocToFormDefinition(docB);

        // Same doc state + deterministic resolution → same result everywhere
        expect(finalA.toJSON()).toEqual(finalB.toJSON());
        const siblingIds = finalA.root.children
            .map((uid) => finalA.getElementById(uid)?.id)
            .sort();
        expect(siblingIds).toEqual(['username', 'username_2']);
    });

    it('two clients adding to the same position both keep their element', () => {
        const docA = formDefinitionToYDoc(buildSampleForm());
        const docB = new Y.Doc();
        Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));

        const rootUid = yDocToFormDefinition(docA).root.uid;
        const emailA = new StringElement({ id: 'emailA', title: 'Email (A)' });
        const emailB = new StringElement({ id: 'emailB', title: 'Email (B)' });

        // Both insert at index 0 concurrently — no lost update
        addElement(docA, rootUid, emailA, 0);
        addElement(docB, rootUid, emailB, 0);

        Y.applyUpdate(docA, Y.encodeStateAsUpdate(docB));
        Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));

        const finalA = yDocToFormDefinition(docA);
        const finalB = yDocToFormDefinition(docB);

        expect(finalA.toJSON()).toEqual(finalB.toJSON());
        expect(finalA.root.children).toContain(emailA.uid);
        expect(finalA.root.children).toContain(emailB.uid);
    });

    it('two clients adding dependency groups concurrently converge', () => {
        const docA = formDefinitionToYDoc(buildSampleForm());
        const docB = new Y.Doc();
        Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));

        const nameUid = yDocToFormDefinition(docA).root.children[0];
        const groupA = buildSampleDependencyGroup();
        const groupB = new DependencyGroup({
            id: 'dep_name',
            dependencies: [],
            relation: DependencyRelation.OR,
        });

        // Client A: add group A + attach; Client B: add group B + attach
        addDependencyGroup(docA, groupA);
        setElementDependency(docA, nameUid, groupA.uid);
        addDependencyGroup(docB, groupB);
        setElementDependency(docB, nameUid, groupB.uid);

        Y.applyUpdate(docA, Y.encodeStateAsUpdate(docB));
        Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));

        const finalA = yDocToFormDefinition(docA);
        const finalB = yDocToFormDefinition(docB);

        expect(finalA.toJSON()).toEqual(finalB.toJSON());
        // last-writer-wins on the dependencyGroup field, but no group is lost
        expect(finalA.dependencyIndex.size).toBe(2);
        const attachedUid =
            finalA.getElementById(nameUid)!.data.dependencyGroup;
        expect([groupA.uid, groupB.uid]).toContain(attachedUid);
    });
});

describe('awareness helpers', () => {
    /** Minimal in-memory awareness implementation for testing. */
    function createMockAwareness() {
        const states = new Map<number, unknown>();
        const localClientId = 1;
        return {
            clientID: localClientId,
            setLocalState(state: unknown) {
                states.set(localClientId, state);
            },
            setLocalStateField(field: string, value: unknown) {
                const current = (states.get(localClientId) ?? {}) as Record<
                    string,
                    unknown
                >;
                states.set(localClientId, { ...current, [field]: value });
            },
            getStates() {
                return states;
            },
            on() {},
            off() {},
        };
    }

    it('publishes user, selection and editing state', () => {
        const awareness = createMockAwareness();
        setPresenceUser(awareness, {
            id: 'u1',
            name: 'Alice',
            color: '#ff0000',
        });
        setSelectedElement(awareness, 'el-1');
        setEditingField(awareness, 'el-1', 'title');

        const local = awareness.getStates().get(1) as any;
        expect(local.user.name).toBe('Alice');
        expect(local.selection.elementId).toBe('el-1');
        expect(local.editing).toEqual({ elementId: 'el-1', field: 'title' });
    });

    it('returns connected users from the shared awareness map', () => {
        const awareness = createMockAwareness();
        setPresenceUser(awareness, {
            id: 'u1',
            name: 'Alice',
            color: '#ff0000',
        });
        awareness.getStates().set(2, {
            user: { id: 'u2', name: 'Bob', color: '#00ff00' },
        });

        const users = getConnectedUsers(awareness);
        expect(users.map((u) => u.name).sort()).toEqual(['Alice', 'Bob']);

        const remote = getRemotePresenceStates(awareness);
        expect(remote.size).toBe(1);
        expect(remote.get(2)!.user.name).toBe('Bob');
    });

    it('returns remote presences as a typed array with client ids', () => {
        const awareness = createMockAwareness();
        awareness.getStates().set(2, {
            user: { id: 'u2', name: 'Bob', color: '#00ff00' },
            selection: { elementId: 'el-2' },
            editing: { elementId: 'el-2', field: 'title' },
        });

        const presences = getRemotePresences(awareness);
        expect(presences).toHaveLength(1);
        expect(presences[0]).toEqual({
            clientId: 2,
            user: { id: 'u2', name: 'Bob', color: '#00ff00' },
            selection: { elementId: 'el-2' },
            editing: { elementId: 'el-2', field: 'title' },
        });
    });

    it('normalizes malformed remote states without crashing', () => {
        const awareness = createMockAwareness();
        // no user → ignored entirely
        awareness.getStates().set(2, { selection: { elementId: 'x' } });
        // missing/partial selection + editing → normalized to nulls
        awareness.getStates().set(3, {
            user: { id: 'u3', name: 'Carol', color: '#0000ff' },
        });
        awareness.getStates().set(4, 'not-an-object');

        const presences = getRemotePresences(awareness);
        expect(presences).toHaveLength(1);
        expect(presences[0].user.name).toBe('Carol');
        expect(presences[0].selection).toEqual({ elementId: null });
        expect(presences[0].editing).toEqual({
            elementId: null,
            field: null,
        });
    });

    it('assigns a deterministic color per user id', () => {
        const a1 = colorForUser('u1');
        const a2 = colorForUser('u1');
        const b = colorForUser('u2');
        expect(a1).toBe(a2);
        expect(a1).toMatch(/^#[0-9a-f]{6}$/i);
        expect(b).toMatch(/^#[0-9a-f]{6}$/i);
        // all colors come from the palette (finite set)
        const all = ['a', 'b', 'c', 'd'].map((id) => colorForUser(id));
        expect(new Set(all).size).toBeLessThanOrEqual(10);
    });

    it('never assigns the reserved own-user color (bootstrap primary)', () => {
        // OWN_USER_COLOR is reserved for the local user's own avatar —
        // remote users must always render in a different color.
        for (let i = 0; i < 200; i++) {
            expect(colorForUser(`user-${i}`)).not.toBe(OWN_USER_COLOR);
        }
    });
});
