import * as Y from 'yjs';
import { FormDefinition } from '../form-definition';
import { ContainerElement } from '../container';
import { FormElement } from '../form-element';
import { Dependency, DependencyGroup } from '../dependency';
import { Form } from '../form';
import { FormElementRegistry } from '../registry';
import { Layout } from '../utils';
import type { z } from 'zod';

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
 * Clear every map of a Y.Doc (root, elements, dependencies) in one
 * transaction. Used before hydrating a different definition into an
 * existing document (e.g. loading a definition in the local engine or a
 * server-side import).
 */
export function clearDocument(doc: Y.Doc): void {
    doc.transact(() => {
        doc.getMap(ROOT_MAP).clear();
        doc.getMap(ELEMENTS_MAP).clear();
        doc.getMap(DEPENDENCIES_MAP).clear();
    });
}

/**
 * Write a FormDefinition INTO an existing Y.Doc (the maps are cleared
 * first). This is the in-place counterpart of formDefinitionToYDoc, which
 * creates a brand-new document — callers that need to replace the content
 * of a live document (local engine load, server-side imports) use this so
 * observers on the document fire exactly once.
 */
export function hydrateDocument(
    doc: Y.Doc,
    formDefinition: FormDefinition
): void {
    doc.transact(() => {
        const root = doc.getMap(ROOT_MAP);
        const elements = doc.getMap(ELEMENTS_MAP);
        const dependencies = doc.getMap(DEPENDENCIES_MAP);

        root.clear();
        elements.clear();
        dependencies.clear();

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
        for (const [uid, dep] of formDefinition.dependencyIndex) {
            const depMap = new Y.Map<unknown>();
            for (const [key, value] of Object.entries(dep.data)) {
                depMap.set(key, plainToYType(value));
            }
            dependencies.set(uid, depMap);
        }
    });
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

// ─── Validation (zod reuse) ──────────────────────────────────────────────────

/** Constructor type of a registered element class (schema + name). */
type FormElementConstructor = {
    new (...args: never[]): FormElement;
    schema: z.ZodTypeAny;
    name: string;
};

/**
 * Resolve the element class for a `type` string — the same registry that
 * powers FormDefinition.fromJSON. Throws for unknown types so corrupted
 * documents surface early instead of being written to the shared doc.
 */
export function getElementCtorByType(type: string): FormElementConstructor {
    const ctor = FormElementRegistry.get(type);
    if (!ctor) {
        throw new Error(`Unknown FormElement type "${type}"`);
    }
    return ctor as unknown as FormElementConstructor;
}

/** The class whose zod schema validates an element's data. */
function ctorOfElement(element: FormElement): FormElementConstructor {
    const byType = FormElementRegistry.get(
        (element.data as { type?: string }).type ?? ''
    );
    return (byType ?? element.constructor) as unknown as FormElementConstructor;
}

/** The zod schema (class) for an element map already stored in the doc. */
function ctorOfElementMap(elementMap: Y.Map<unknown>) {
    const type = elementMap.get('type');
    if (typeof type !== 'string') {
        throw new Error('Element map is missing a "type" field');
    }
    return getElementCtorByType(type);
}

/**
 * Validate an element's data against its class zod schema — the same
 * validation FormDefinition.fromJSON applies when loading a document, so
 * nothing that would fail a reload can ever be written to the shared doc.
 * Returns the (possibly defaulted) validated data.
 */
export function validateElementData(
    element: FormElement
): Record<string, unknown> {
    const ctor = ctorOfElement(element);
    const result = ctor.schema.safeParse(element.data);
    if (!result.success) {
        const type = (element.data as { type?: string }).type ?? 'unknown';
        throw new Error(
            `Invalid data for ${type} element "${element.uid}": ${result.error.message}`
        );
    }
    return result.data as Record<string, unknown>;
}

/** Validates a plain data object against the class of a stored element map. */
export function validateElementMapData(
    elementMap: Y.Map<unknown>,
    data: Record<string, unknown>
): void {
    const ctor = ctorOfElementMap(elementMap);
    const result = ctor.schema.safeParse(data);
    if (!result.success) {
        const type = elementMap.get('type');
        throw new Error(
            `Invalid data for ${type} element "${elementMap.get('uid')}": ${result.error.message}`
        );
    }
}

/** Validates a plain data object against the Form (root) schema. */
export function validateRootData(data: Record<string, unknown>): void {
    const result = Form.schema.safeParse(data);
    if (!result.success) {
        throw new Error(`Invalid Form data: ${result.error.message}`);
    }
}

/**
 * Validate the target of an insert/move: either the root Form or a
 * ContainerElement (a map with a children Y.Array). Mirrors
 * FormDefinition.liveChildrenOf — non-containers (e.g. leaf controls)
 * cannot receive children.
 */
export function assertContainer(doc: Y.Doc, containerUid: string): void {
    const root = doc.getMap(ROOT_MAP);
    if (containerUid === root.get('uid')) {
        const children = root.get(CHILDREN_KEY);
        if (children instanceof Y.Array) return;
        throw new Error('Root Form has no children array');
    }
    const element = getElementMap(doc, containerUid);
    if (!element) {
        throw new Error(`Container "${containerUid}" not found`);
    }
    if (!(element.get(CHILDREN_KEY) instanceof Y.Array)) {
        throw new Error(`Container "${containerUid}" is not a container`);
    }
}

/**
 * Build a Y.Map for an element, validating its data first. Every element map
 * written through this helper passes the class zod schema, so a reload via
 * FormDefinition.fromJSON can never fail on data the adapter wrote itself.
 */
export function createElementMap(
    element: FormElement
): { uid: string; map: Y.Map<unknown> } {
    const data = validateElementData(element);
    const map = new Y.Map<unknown>();
    for (const [key, value] of Object.entries(data)) {
        map.set(key, plainToYType(value));
    }
    return { uid: element.uid, map };
}

/**
 * Ensure the element carries a uid — the palette constructs elements with a
 * fresh uid (Entity defaults), this is only a safety net for callers that
 * build plain data. Mirrors Entity.setDefaults.
 */
export function ensureUid(element: FormElement): void {
    if (!element.uid) {
        element.data.uid = globalThis.crypto.randomUUID();
    }
}

/** Removes an element uid from the first parent children array that contains it. */
export function removeFromParent(
    doc: Y.Doc,
    elementUid: string
): boolean {
    const root = doc.getMap(ROOT_MAP);
    const rootChildren = root.get(CHILDREN_KEY);
    if (rootChildren instanceof Y.Array) {
        const idx = rootChildren.toArray().indexOf(elementUid);
        if (idx !== -1) {
            rootChildren.delete(idx, 1);
            return true;
        }
    }
    for (const [, elementMap] of doc.getMap(ELEMENTS_MAP)) {
        if (!(elementMap instanceof Y.Map)) continue;
        const children = elementMap.get(CHILDREN_KEY);
        if (children instanceof Y.Array) {
            const idx = children.toArray().indexOf(elementUid);
            if (idx !== -1) {
                children.delete(idx, 1);
                return true;
            }
        }
    }
    return false;
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
 * The element's data is validated against its class zod schema before it is
 * written (createElementMap) and the target must be a container — the same
 * checks FormDefinition.fromJSON / liveChildrenOf enforce on load and move.
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
        ensureUid(element);
        const { uid, map } = createElementMap(element);
        doc.getMap(ELEMENTS_MAP).set(uid, map);
        const children = getChildrenArray(doc, containerUid);
        if (index === undefined) {
            children.push([uid]);
        } else {
            children.insert(Math.min(index, children.length), [uid]);
        }
    });
}

/**
 * Add a whole element subtree (e.g. a button-group with its buttons) to a
 * container. All element maps are validated and written in one transaction;
 * only the first element is inserted into the container's children array —
 * the others are referenced by uid from the root element's data (exactly
 * like any other flat element set).
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
        assertContainer(doc, containerUid);
        const elementsMap = doc.getMap(ELEMENTS_MAP);
        for (const element of elements) {
            ensureUid(element);
            const { uid, map } = createElementMap(element);
            elementsMap.set(uid, map);
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

/**
 * Update a single field of an element (title, required, placeholder, ...).
 *
 * The merged data (current map + the change) is validated against the
 * element's class zod schema before writing — a change that would leave the
 * element in a state FormDefinition.fromJSON rejects is refused with a
 * descriptive error instead of being synced to every client.
 */
export function updateElementField(
    doc: Y.Doc,
    uid: string,
    field: string,
    value: unknown
): void {
    doc.transact(() => {
        // The root Form lives in the root map, not the elements map.
        const root = doc.getMap(ROOT_MAP);
        if (root.get('uid') === uid) {
            const merged: Record<string, unknown> = {
                ...root.toJSON(),
                [field]: value,
            };
            validateRootData(merged);
            root.set(field, plainToYType(value));
            return;
        }
        const element = getElementMap(doc, uid);
        if (!element) throw new Error(`Element "${uid}" not found`);
        const merged: Record<string, unknown> = {
            ...element.toJSON(),
            [field]: value,
        };
        validateElementMapData(element, merged);
        element.set(field, plainToYType(value));
    });
}

/**
 * Move an element into targetContainer at newIndex.
 * The element itself stays put; only the parents' children arrays change
 * (delete from the old parent's Y.Array, insert into the target's Y.Array).
 * Delete happens first, so moving within the same parent keeps the final
 * order correct. The target must be a container (root or ContainerElement).
 */
export function moveElement(
    doc: Y.Doc,
    elementUid: string,
    targetContainerUid: string,
    newIndex: number
): void {
    doc.transact(() => {
        const removed = removeFromParent(doc, elementUid);
        if (!removed) {
            throw new Error(
                `Element "${elementUid}" not found in any parent's children`
            );
        }

        // insert into target (delete first keeps the order correct when the
        // target is the old parent itself)
        assertContainer(doc, targetContainerUid);
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
        removeFromParent(doc, elementUid);

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

/** Validates a dependency entity's data against its class zod schema. */
export function validateDependencyData(
    dependency: Dependency | DependencyGroup
): Record<string, unknown> {
    const ctor =
        dependency instanceof DependencyGroup
            ? DependencyGroup
            : Dependency;
    const result = ctor.schema.safeParse(dependency.data);
    if (!result.success) {
        throw new Error(
            `Invalid data for ${dependency instanceof DependencyGroup ? 'DependencyGroup' : 'Dependency'} "${dependency.uid}": ${result.error.message}`
        );
    }
    return result.data as Record<string, unknown>;
}

/** Writes a dependency entity map, validated against its class schema. */
function setDependencyMap(
    doc: Y.Doc,
    dependency: Dependency | DependencyGroup
): void {
    const data = validateDependencyData(dependency);
    const map = new Y.Map<unknown>();
    for (const [key, value] of Object.entries(data)) {
        map.set(key, plainToYType(value));
    }
    doc.getMap(DEPENDENCIES_MAP).set(dependency.uid, map);
}

/**
 * Add a plain Dependency to a DependencyGroup (mirrors
 * FormDefinition.addDependencyToGroup): the dependency is written as a
 * first-class entity and its uid is appended to the group's `dependencies`
 * Y.Array. The group must exist and the dependency data must pass the
 * Dependency zod schema.
 */
export function addDependencyToGroup(
    doc: Y.Doc,
    dependency: Dependency,
    groupUid: string
): void {
    doc.transact(() => {
        const group = getDependencyGroupMap(doc, groupUid);
        if (!group) {
            throw new Error(`Parent DependencyGroup "${groupUid}" not found`);
        }
        const dependencies = group.get(DEPENDENCIES_KEY);
        if (!(dependencies instanceof Y.Array)) {
            throw new Error(
                `Dependency group "${groupUid}" has no ${DEPENDENCIES_KEY} array`
            );
        }
        setDependencyMap(doc, dependency);
        dependencies.push([dependency.uid]);
    });
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
        setDependencyMap(doc, group);

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
    const merged: Record<string, unknown> = {
        ...group.toJSON(),
        [field]: value,
    };
    const result = DependencyGroup.schema.safeParse(merged);
    if (!result.success) {
        throw new Error(
            `Invalid data for DependencyGroup "${uid}": ${result.error.message}`
        );
    }
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
        if (!getDependencyGroupMap(doc, groupUid)) {
            throw new Error(
                `Dependency group "${groupUid}" not found in the document`
            );
        }
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
