import * as Y from 'yjs';
import { FormDefinition } from '../form-definition';
import { ContainerElement } from '../container';
import { FormElement } from '../form-element';
import { DependencyGroup } from '../dependency';
import { Form } from '../form';
import { Layout } from '../utils';

/**
 * Yjs document layout for a FormDefinition:
 *
 *   doc.getMap("root")         — Y.Map with the Form's plain data (title,
 *                                description, layout, ...). The root `children`
 *                                entry is a Y.Array<uid>.
 *   doc.getMap("elements")     — Y.Map<uid, Y.Map<data>>, one Y.Map per element.
 *                                A container's `children` entry is a Y.Array<uid>,
 *                                so concurrent add/move/remove operations merge
 *                                conflict-free at the exact position.
 *   doc.getMap("dependencies") — Y.Map<uid, Y.Map<data>>, one Y.Map per
 *                                Dependency and DependencyGroup entity. Nested
 *                                groups and plain dependencies are referenced
 *                                by uid (dependencies: Y.Array<uid>), exactly
 *                                like elements' children — both trees are a
 *                                flat set of entities + ordered uid lists, so
 *                                the same index logic (FormDefinition.
 *                                nodesIndex / parentIndex / dependencyIndex /
 *                                dependencyParentIndex) applies to both.
 *
 * Order: the tree structure (who is inside what, and in which order) is
 * defined exclusively by the children Y.Arrays. Moving an element = delete
 * from the old parent's Y.Array + insert into the target's Y.Array — Yjs
 * arrays are CRDT sequences, so concurrent moves/inserts converge and the
 * order stays deterministic for every client.
 *
 * Only the tree structure lives in the Y.Doc. JSON Schema + UI Schema are
 * derived on demand with SchemaGenerator, so there is exactly ONE source of
 * truth per form — no "schema vs. tree" duplication that could diverge while
 * collaborating.
 */

export const ROOT_MAP = 'root';
export const ELEMENTS_MAP = 'elements';
export const DEPENDENCIES_MAP = 'dependencies';
export const CHILDREN_KEY = 'children';
/** uid list of Dependency + DependencyGroup entities inside a group. */
export const DEPENDENCIES_KEY = 'dependencies';

/** Converts a plain JSON value into a Yjs type (Y.Map / Y.Array / primitive). */
export function plainToYType(value: unknown): unknown {
    if (Array.isArray(value)) {
        const arr = new Y.Array<unknown>();
        for (const item of value) {
            arr.push([plainToYType(item)]);
        }
        return arr;
    }
    if (value !== null && typeof value === 'object') {
        const map = new Y.Map<unknown>();
        for (const [key, item] of Object.entries(value)) {
            map.set(key, plainToYType(item));
        }
        return map;
    }
    return value;
}

/**
 * Hydrate a Y.Doc from a FormDefinition.
 *
 * This is the entry point when a client opens a form: load the persisted
 * FormDefinition (or import via fromJsonSchemaAndUiSchema) and convert it.
 * From then on, every mutation goes through the Y.Doc (see addElement,
 * updateElementField, moveElement, deleteElement and the dependency helpers
 * below).
 */
export function formDefinitionToYDoc(formDefinition: FormDefinition): Y.Doc {
    const doc = new Y.Doc();
    const root = doc.getMap(ROOT_MAP);
    const elements = doc.getMap(ELEMENTS_MAP);
    const dependencies = doc.getMap(DEPENDENCIES_MAP);

    for (const [key, value] of Object.entries(formDefinition.root.data)) {
        root.set(key, plainToYType(value));
    }

    for (const [uid, element] of formDefinition.nodesIndex) {
        const elementMap = new Y.Map<unknown>();
        for (const [key, value] of Object.entries(element.data)) {
            elementMap.set(key, plainToYType(value));
        }
        elements.set(uid, elementMap);
    }

    // dependencyIndex holds Dependency AND DependencyGroup entities — both are
    // first-class entities with plain `.data`, so they serialize identically.
    for (const [uid, dep] of formDefinition.dependencyIndex) {
        const depMap = new Y.Map<unknown>();
        for (const [key, value] of Object.entries(dep.data)) {
            depMap.set(key, plainToYType(value));
        }
        dependencies.set(uid, depMap);
    }

    return doc;
}

/**
 * Rebuild a FormDefinition from a Y.Doc.
 *
 * Y.Map.toJSON() recursively converts Y.Map/Y.Array back to plain
 * objects/arrays; the result is validated against the zod schemas by
 * FormDefinition.fromJSON — corrupted documents throw here.
 *
 * Concurrent name conflicts are resolved deterministically afterwards
 * (see ensureUniqueSiblingIds), so every client converges to the same
 * FormDefinition.
 */
export function yDocToFormDefinition(doc: Y.Doc): FormDefinition {
    const root = doc.getMap(ROOT_MAP).toJSON() as Record<string, unknown>;
    const elements = doc.getMap(ELEMENTS_MAP).toJSON() as Record<
        string,
        object
    >;
    const dependencies = doc.getMap(DEPENDENCIES_MAP).toJSON() as Record<
        string,
        object
    >;
    // A brand-new document has no root yet — return a fresh, empty
    // FormDefinition instead of failing validation. The Y.Doc stays
    // untouched; the first element added initializes the root map.
    if (root.type !== 'form' || typeof root.uid !== 'string') {
        return emptyFormDefinition();
    }
    const formDefinition = FormDefinition.fromJSON(
        JSON.stringify({ root, elements, dependencies })
    );
    ensureUniqueSiblingIds(formDefinition);
    return formDefinition;
}

/** A minimal, empty FormDefinition (used for uninitialized Y.Docs). */
export function emptyFormDefinition(): FormDefinition {
    return new FormDefinition(
        new Form({
            id: 'form',
            title: 'My Form',
            children: [],
        })
    );
}

/**
 * Resolve sibling name (id) conflicts after a Yjs merge.
 *
 * Yjs maps are last-write-wins per key: two users renaming DIFFERENT
 * elements to the SAME name concurrently both "win" (the key is the uid,
 * so nothing gets overwritten) — leaving two siblings with the same name,
 * which would break the generated JSON Schema path.
 *
 * This walks the tree top-down, level by level, and renames duplicates to
 * `<name>_2`, `<name>_3`, ... The document state converges (CRDT) and this
 * algorithm is deterministic, so every client applies the same renames and
 * converges to the same FormDefinition. It runs on every rebuild, so a
 * freshly added element with a conflicting name is resolved again as soon
 * as the doc syncs.
 */
export function ensureUniqueSiblingIds(formDefinition: FormDefinition): void {
    const visit = (parent: Form | ContainerElement): void => {
        const seen = new Set<string>();
        for (const childUid of parent.children) {
            const child = formDefinition.getElementById(childUid);
            if (!child) continue;
            let name = child.id;
            if (seen.has(name)) {
                let suffix = 2;
                while (seen.has(`${name}_${suffix}`)) {
                    suffix++;
                }
                name = `${name}_${suffix}`;
                child.data.id = name;
            }
            seen.add(name);
            if (child instanceof ContainerElement) {
                visit(child);
            }
        }
    };
    visit(formDefinition.root);
}

/** Returns the Y.Map of an element, or undefined if it does not exist. */
export function getElementMap(
    doc: Y.Doc,
    uid: string
): Y.Map<unknown> | undefined {
    const elements = doc.getMap(ELEMENTS_MAP);
    const map = elements.get(uid);
    return map instanceof Y.Map ? map : undefined;
}

/** Returns the Y.Array of children of a container (or the root). */
export function getChildrenArray(
    doc: Y.Doc,
    containerUid: string
): Y.Array<string> {
    const root = doc.getMap(ROOT_MAP);
    if (containerUid === root.get('uid')) {
        const children = root.get(CHILDREN_KEY);
        if (children instanceof Y.Array) return children;
    }
    const element = getElementMap(doc, containerUid);
    const children = element?.get(CHILDREN_KEY);
    if (children instanceof Y.Array) return children;
    throw new Error(`Container "${containerUid}" has no children array`);
}

/**
 * Initialize a brand-new Y.Doc with the root Form data.
 *
 * Used server-side (onLoadDocument) so every client receives an initialized
 * document, and as a client-side safety net before the first write. No-op
 * when the root is already initialized.
 */
export function initializeEmptyDocument(
    doc: Y.Doc,
    opts: { uid?: string; id?: string; title?: string } = {}
): void {
    const root = doc.getMap(ROOT_MAP);
    if (root.get('uid') !== undefined) return;
    root.set('type', 'form');
    root.set('uid', opts.uid ?? globalThis.crypto.randomUUID());
    root.set('id', opts.id ?? 'form');
    root.set('title', opts.title ?? 'My Form');
    root.set('layout', Layout.Vertical);
    root.set(CHILDREN_KEY, new Y.Array<string>());
}

/**
 * Add a new element to a container (or to the root when containerUid is the
 * form's uid). The whole operation runs inside one Yjs transaction, so peers
 * see it atomically and it merges conflict-free with concurrent edits.
 *
 * The element must carry a fresh `uid` (generated by Entity), otherwise two
 * clients adding "the same" element would silently overwrite each other.
 * `index` is the position inside the container's children array — the order
 * of elements is part of the synced state.
 */
export function addElement(
    doc: Y.Doc,
    containerUid: string,
    element: FormElement,
    index?: number
): void {
    doc.transact(() => {
        initializeEmptyDocument(doc);
        const elements = doc.getMap(ELEMENTS_MAP);
        const elementMap = new Y.Map<unknown>();
        for (const [key, value] of Object.entries(element.data)) {
            elementMap.set(key, plainToYType(value));
        }
        elements.set(element.uid, elementMap);

        const children = getChildrenArray(doc, containerUid);
        if (index === undefined) {
            children.push([element.uid]);
        } else {
            children.insert(index, [element.uid]);
        }
    });
}

/**
 * Add a whole element subtree (e.g. a button-group with its buttons) to a
 * container. All element maps are written in one transaction; only the first
 * element is inserted into the container's children array — the others are
 * referenced by uid from the root element's data (exactly like any other
 * flat element set).
 */
export function addElements(
    doc: Y.Doc,
    containerUid: string,
    elements: FormElement[],
    index?: number
): void {
    if (elements.length === 0) return;
    doc.transact(() => {
        initializeEmptyDocument(doc);
        const elementsMap = doc.getMap(ELEMENTS_MAP);
        for (const element of elements) {
            const elementMap = new Y.Map<unknown>();
            for (const [key, value] of Object.entries(element.data)) {
                elementMap.set(key, plainToYType(value));
            }
            elementsMap.set(element.uid, elementMap);
        }

        const children = getChildrenArray(doc, containerUid);
        if (index === undefined) {
            children.push([elements[0].uid]);
        } else {
            children.insert(Math.min(index, children.length), [
                elements[0].uid,
            ]);
        }
    });
}

/** Update a single field of an element (title, required, placeholder, ...). */
export function updateElementField<T extends FormElement | Form>(
    doc: Y.Doc,
    uid: string,
    field: string,
    value: Partial<T['data']>
): void {
    doc.transact(() => {
        // The root Form lives in the root map, not the elements map.
        const root = doc.getMap(ROOT_MAP);
        if (root.get('uid') === uid) {
            root.set(field, plainToYType(value));
            return;
        }
        const element = getElementMap(doc, uid);
        if (!element) throw new Error(`Element "${uid}" not found`);
        element.set(field, plainToYType(value));
    });
}

/**
 * Move an element into targetContainer at newIndex.
 * The element itself stays put; only the parents' children arrays change
 * (delete from the old parent's Y.Array, insert into the target's Y.Array).
 * Delete happens first, so moving within the same parent keeps the final
 * order correct.
 */
export function moveElement(
    doc: Y.Doc,
    elementUid: string,
    targetContainerUid: string,
    newIndex: number
): void {
    doc.transact(() => {
        // remove from old parent — scan the root children array and every
        // container's children array (the element can be anywhere in the tree)
        const root = doc.getMap(ROOT_MAP);
        const allParents: Y.Array<string>[] = [];
        const rootChildren = root.get(CHILDREN_KEY);
        if (rootChildren instanceof Y.Array) allParents.push(rootChildren);
        for (const [, elementMap] of doc.getMap(ELEMENTS_MAP)) {
            if (!(elementMap instanceof Y.Map)) continue;
            const children = elementMap.get(CHILDREN_KEY);
            if (children instanceof Y.Array) allParents.push(children);
        }
        let removed = false;
        for (const parent of allParents) {
            const idx = parent.toArray().indexOf(elementUid);
            if (idx !== -1) {
                parent.delete(idx, 1);
                removed = true;
                break;
            }
        }
        if (!removed) {
            throw new Error(
                `Element "${elementUid}" not found in any parent's children`
            );
        }

        // insert into target
        const targetChildren = getChildrenArray(doc, targetContainerUid);
        const insertIndex = Math.min(newIndex, targetChildren.length);
        targetChildren.insert(insertIndex, [elementUid]);
    });
}

/** Delete an element and its whole subtree from the document. */
export function deleteElement(doc: Y.Doc, elementUid: string): void {
    doc.transact(() => {
        const elements = doc.getMap(ELEMENTS_MAP);

        // capture the element's dependency group BEFORE deleting the map
        const elementMap = getElementMap(doc, elementUid);
        const groupUid = elementMap?.get('dependencyGroup');

        const removeRecursively = (uid: string): void => {
            const element = getElementMap(doc, uid);
            if (!element) return;
            const children = element.get(CHILDREN_KEY);
            if (children instanceof Y.Array) {
                for (const childUid of children.toArray()) {
                    removeRecursively(childUid);
                }
            }
            elements.delete(uid);
        };
        removeRecursively(elementUid);

        // detach from parent (root children + every container's children)
        const root = doc.getMap(ROOT_MAP);
        const candidates: Y.Array<string>[] = [];
        const rootChildren = root.get(CHILDREN_KEY);
        if (rootChildren instanceof Y.Array) candidates.push(rootChildren);
        for (const [, elementMap2] of elements) {
            if (!(elementMap2 instanceof Y.Map)) continue;
            const children = elementMap2.get(CHILDREN_KEY);
            if (children instanceof Y.Array) candidates.push(children);
        }
        for (const parent of candidates) {
            const idx = parent.toArray().indexOf(elementUid);
            if (idx !== -1) {
                parent.delete(idx, 1);
                break;
            }
        }

        // cascade-delete the element's dependency group (and its nested groups)
        if (typeof groupUid === 'string') {
            deleteDependencyGroupTree(doc, groupUid);
        }
    });
}

// ─── Dependency groups (first-class entities, like elements) ─────────────────

/** Returns the Y.Map of a dependency group, or undefined if it does not exist. */
export function getDependencyGroupMap(
    doc: Y.Doc,
    uid: string
): Y.Map<unknown> | undefined {
    const dependencies = doc.getMap(DEPENDENCIES_MAP);
    const map = dependencies.get(uid);
    return map instanceof Y.Map ? map : undefined;
}

/**
 * Add a dependency group to the document. Groups are entities with their own
 * uid (like elements) and are referenced by elements via the `dependencyGroup`
 * field and by other groups via the `dependencies` uid list — pass
 * parentGroupUid to nest the new group under an existing one (appended to its
 * dependencies Y.Array).
 */
export function addDependencyGroup(
    doc: Y.Doc,
    group: DependencyGroup,
    parentGroupUid?: string
): void {
    doc.transact(() => {
        const dependencies = doc.getMap(DEPENDENCIES_MAP);
        const groupMap = new Y.Map<unknown>();
        for (const [key, value] of Object.entries(group.data)) {
            groupMap.set(key, plainToYType(value));
        }
        dependencies.set(group.uid, groupMap);

        if (parentGroupUid) {
            const parentMap = getDependencyGroupMap(doc, parentGroupUid);
            if (!parentMap) {
                throw new Error(
                    `Parent dependency group "${parentGroupUid}" not found`
                );
            }
            const nested = parentMap.get(DEPENDENCIES_KEY);
            if (!(nested instanceof Y.Array)) {
                throw new Error(
                    `Dependency group "${parentGroupUid}" has no ${DEPENDENCIES_KEY} array`
                );
            }
            nested.push([group.uid]);
        }
    });
}

/** Update a single field of a dependency group (relation, deps, ...). */
export function updateDependencyGroupField(
    doc: Y.Doc,
    uid: string,
    field: string,
    value: unknown
): void {
    const group = getDependencyGroupMap(doc, uid);
    if (!group) throw new Error(`Dependency group "${uid}" not found`);
    group.set(field, plainToYType(value));
}

/**
 * Attach a dependency group to an element (set the element's dependencyGroup
 * uid reference). Pass undefined to remove the reference.
 */
export function setElementDependency(
    doc: Y.Doc,
    elementUid: string,
    groupUid: string | undefined
): void {
    const element = getElementMap(doc, elementUid);
    if (!element) throw new Error(`Element "${elementUid}" not found`);
    if (groupUid === undefined) {
        element.delete('dependencyGroup');
    } else {
        element.set('dependencyGroup', groupUid);
    }
}

/**
 * Delete a dependency group and its whole nested subtree from the document.
 * Elements referencing the group lose their dependencyGroup reference, and
 * the group is detached from any parent group's dependencies array.
 */
export function deleteDependencyGroup(doc: Y.Doc, groupUid: string): void {
    doc.transact(() => {
        deleteDependencyGroupTree(doc, groupUid);

        // detach from a parent group's dependencies array, if any
        for (const [, groupMap] of doc.getMap(DEPENDENCIES_MAP)) {
            if (!(groupMap instanceof Y.Map)) continue;
            const dependencies = groupMap.get(DEPENDENCIES_KEY);
            if (dependencies instanceof Y.Array) {
                const idx = dependencies.toArray().indexOf(groupUid);
                if (idx !== -1) dependencies.delete(idx, 1);
            }
        }

        // clear references on elements
        for (const [, elementMap] of doc.getMap(ELEMENTS_MAP)) {
            if (!(elementMap instanceof Y.Map)) continue;
            if (elementMap.get('dependencyGroup') === groupUid) {
                elementMap.delete('dependencyGroup');
            }
        }
    });
}

/**
 * Recursively removes a group and its nested groups from the dependencies map.
 * Children are a mix of Dependency and DependencyGroup entities — plain
 * Dependency maps have no `dependencies` array and are just deleted.
 */
function deleteDependencyGroupTree(doc: Y.Doc, groupUid: string): void {
    const dependencies = doc.getMap(DEPENDENCIES_MAP);
    const groupMap = dependencies.get(groupUid);
    if (!(groupMap instanceof Y.Map)) return;
    const nested = groupMap.get(DEPENDENCIES_KEY);
    if (nested instanceof Y.Array) {
        for (const childUid of nested.toArray()) {
            deleteDependencyGroupTree(doc, childUid);
        }
    }
    dependencies.delete(groupUid);
}

/**
 * Convenience helper for building a fresh element for collaboration:
 * returns a data object with a NEW uid that no other client can collide with.
 * Use this when constructing elements from the palette before addElement().
 */
export function withFreshUid<T extends { uid: string }>(data: T): T {
    return {
        ...data,
        uid: `${data.uid}_${globalThis.crypto.randomUUID()}`,
    };
}

/** isContainer check used by observers to know whether children matter. */
export function isContainerElement(
    element: FormElement
): element is ContainerElement {
    return element instanceof ContainerElement;
}
