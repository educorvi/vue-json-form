import { Dependency, DependencyGroup } from './dependency';
import { Form } from './form';
import { FormElement } from './form-element';
import { ContainerElement } from './container';
import { FormElementRegistry } from './registry';

/**
 * FormDefinition wraps a Form tree and maintains five indexes for O(1) access
 * and cheap mutation without tree traversal on every operation.
 *
 *  nodesIndex              — elementUid → FormElement instance
 *  parentIndex             — elementUid → parentUid (root.uid for top-level children)
 *  dependencyIndex         — dependencyUid → Dependency | DependencyGroup instance
 *  dependencyParentIndex   — dependencyUid → parentUid (dependencyGroupUid or elementUid)
 *  elementDependencyGraph  — elementUid → dependencyUid[] (dependencies this element is a source for)
 *
 * The tree structure itself lives in the ordered `children` uid arrays of
 * Form / ContainerElement — the indexes are derived from it and can always
 * be rebuilt (FormDefinition.fromJSON). In realtime collaboration mode the
 * same structure lives in a Y.Doc (Y.Array children) and the indexes are
 * rebuilt from the doc on every change — see schemas/collab/yjs-adapter.ts.
 */
export class FormDefinition {
    readonly nodesIndex = new Map<string, FormElement>();
    readonly parentIndex = new Map<string, string>(); // elementUid → parentUid
    readonly dependencyIndex = new Map<string, Dependency | DependencyGroup>(); // dependencyUid → entity
    readonly dependencyParentIndex = new Map<string, string>(); // dependencyUid → parentUid (group or element)
    readonly elementDependencyGraph = new Map<string, string[]>(); // elementUid → dependencyUid[]

    constructor(
        public readonly root: Form,
        children: FormElement[] = [],
        dependencies: (Dependency | DependencyGroup)[] = []
    ) {
        // Phase 1: index every node by uid (the flat array may list a container
        // before its children — recursing during indexing would miss them).
        this.indexNodes(children);
        // Phase 2: index dependency entities (flat, like elements — nested
        // groups are referenced by uid, so groups must be indexed before
        // elements can resolve their dependencyGroup reference).
        this.indexDependencies(dependencies);
        // Phase 3: parent + element→dependency indexes, derived from the tree
        // structure (root.children is authoritative; flat-array order must not
        // matter).
        this.buildParentIndexes(this.root.children, this.root.uid);
    }

    // ─── Private helpers ────────────────────────────────────────────────────────

    private indexNodes(elements: FormElement[]): void {
        for (const el of elements) {
            if (this.nodesIndex.has(el.uid)) continue;
            this.nodesIndex.set(el.uid, el);
        }
    }

    private indexDependencies(
        dependencies: (Dependency | DependencyGroup)[]
    ): void {
        for (const dep of dependencies) {
            if (this.dependencyIndex.has(dep.uid)) continue;
            this.dependencyIndex.set(dep.uid, dep);
        }
        for (const dep of dependencies) {
            if (dep instanceof Dependency) {
                this.indexSourceDependency(dep);
            } else {
                this.buildDependencyParentIndexes(dep);
            }
        }
    }

    /** elementDependencyGraph: elementUid → dependencies that use it as source. */
    private indexSourceDependency(dependency: Dependency): void {
        const sourceId = dependency.sourceId;
        if (!this.elementDependencyGraph.has(sourceId)) {
            this.elementDependencyGraph.set(sourceId, []);
        }
        const list = this.elementDependencyGraph.get(sourceId);
        if (list && !list.includes(dependency.uid)) {
            list.push(dependency.uid);
        }
    }

    /** Derives dependencyParentIndex from each group's ordered dependencies list. */
    private buildDependencyParentIndexes(group: DependencyGroup): void {
        for (const childUid of group.data.dependencies) {
            const child = this.dependencyIndex.get(childUid);
            if (child) {
                this.dependencyParentIndex.set(childUid, group.uid);
                if (child instanceof DependencyGroup) {
                    this.buildDependencyParentIndexes(child);
                }
            }
        }
    }

    private buildParentIndexes(childUids: string[], parentId: string): void {
        for (const childUid of childUids) {
            const child = this.nodesIndex.get(childUid);
            if (!child) {
                throw new Error(
                    `Child element with uid "${childUid}" not found in nodesIndex`
                );
            }
            this.parentIndex.set(childUid, parentId);
            this.indexElementDependency(child);
            if (child instanceof ContainerElement) {
                this.buildParentIndexes(child.children, childUid);
            }
        }
    }

    /** Registers the element's dependency group as a child of the element. */
    private indexElementDependency(element: FormElement): void {
        const groupUid = element.data.dependencyGroup;
        if (groupUid && this.dependencyIndex.has(groupUid)) {
            this.dependencyParentIndex.set(groupUid, element.uid);
        }
    }

    /** Removes a dependency entity and its whole nested subtree from the indexes. */
    private removeDependencySubtree(dependencyUid: string): void {
        const dep = this.dependencyIndex.get(dependencyUid);
        if (!dep) return;
        if (dep instanceof DependencyGroup) {
            for (const childUid of dep.data.dependencies) {
                this.removeDependencySubtree(childUid);
            }
        }
        this.dependencyIndex.delete(dependencyUid);
        this.dependencyParentIndex.delete(dependencyUid);
    }

    private removeFromIndexes(element: FormElement): void {
        this.nodesIndex.delete(element.uid);
        this.parentIndex.delete(element.uid);

        // delete all dependencies this element is a source for
        const sources = this.getDependenciesElementIsSourceFor(element.uid);
        for (const sourceId of sources) {
            this.dependencyIndex.delete(sourceId);
        }
        this.elementDependencyGraph.delete(element.uid);

        // cascade-delete the element's own dependency group (and its nested groups)
        this.deleteDependencyFromIndexes(element.dependencyGroup);

        if (element instanceof ContainerElement) {
            for (const childId of element.children) {
                const child = this.getElementById(childId);
                if (child) {
                    this.removeFromIndexes(child);
                } else {
                    throw new Error(
                        `Child element with uid "${childId}" not found in nodesIndex`
                    );
                }
            }
        }
    }

    /** helper method to delete a dependency or dependency group and all its sub-dependencies from the indexes */
    private deleteDependencyFromIndexes(
        dependencyOrGroupId: string | undefined
    ): void {
        if (!dependencyOrGroupId) return;
        const depGroup = this.getDependency_Group(dependencyOrGroupId);
        if (!depGroup) return;

        this.dependencyIndex.delete(dependencyOrGroupId);
        this.dependencyParentIndex.delete(dependencyOrGroupId);

        if (depGroup instanceof DependencyGroup) {
            const subDependencies = depGroup.dependencies;
            for (const subDepId of subDependencies) {
                this.deleteDependencyFromIndexes(subDepId);
            }
        }
    }

    getDependenciesElementIsSourceFor(elementId: string): string[] {
        const sourceIds = this.elementDependencyGraph.get(elementId);
        return sourceIds ?? [];
    }

    /** Returns the LIVE children uid array of a parent (Form or ContainerElement). */
    private liveChildrenOf(parentId: string): string[] {
        if (parentId === this.root.uid) return this.root.children;
        const parent = this.getElementById(parentId);
        if (!parent || !(parent instanceof ContainerElement)) {
            throw new Error(`Parent "${parentId}" is not a ContainerElement`);
        }
        return parent.children;
    }

    // ─── Public commands ─────────────────────────────────────────────────────────

    getElementById(elementId: string): FormElement | undefined {
        return this.nodesIndex.get(elementId);
    }

    getParentId(elementId: string): string | undefined {
        return this.parentIndex.get(elementId);
    }

    getParent(elementId: string): FormElement | undefined {
        const parentId = this.getParentId(elementId);
        if (!parentId) return undefined;
        return this.getElementById(parentId);
    }

    getDependency_Group(
        dependencyId: string
    ): Dependency | DependencyGroup | undefined {
        return this.dependencyIndex.get(dependencyId);
    }

    getDependencyGroupById(groupId: string): DependencyGroup | undefined {
        const dep = this.dependencyIndex.get(groupId);
        return dep instanceof DependencyGroup ? dep : undefined;
    }

    getParentOfDependency_Group(
        dependencyId: string
    ): DependencyGroup | FormElement | undefined {
        const parentId = this.dependencyParentIndex.get(dependencyId);
        if (!parentId) return undefined;
        const parentElement = this.getElementById(parentId);
        if (parentElement) return parentElement;
        const parentDependencyGroup = this.getDependency_Group(parentId);
        if (parentDependencyGroup instanceof DependencyGroup) {
            return parentDependencyGroup;
        }
        // TODO proper logging
        console.log(
            `Warning: dependencyParentIndex for dependency "${dependencyId}" points to "${parentId}", which is neither a FormElement nor a DependencyGroup.`
        );
        return undefined;
    }

    getDependencyParentId(groupId: string): string | undefined {
        return this.dependencyParentIndex.get(groupId);
    }

    getDependencyParent(groupId: string): DependencyGroup | undefined {
        const parentId = this.getDependencyParentId(groupId);
        if (!parentId) return undefined;
        return this.getDependencyGroupById(parentId);
    }

    /**
     * Move an existing element to a new position inside targetContainer.
     * The tree order is defined by the children uid arrays — this method
     * removes the uid from the old parent's array and inserts it at newIndex
     * in the target's array (delete-then-insert, so moving within the same
     * parent keeps the final order correct).
     *
     * NOTE: targetContainer can be a ContainerElement or the root Form.
     *       Pass this.root to move an element to the top level.
     */
    moveElement(
        formElementId: string,
        targetContainer: ContainerElement | Form,
        newIndex: number
    ): void {
        const element = this.getElementById(formElementId);
        if (!element) throw new Error(`Element "${formElementId}" not found`);

        const oldParentId = this.getParentId(formElementId);
        if (oldParentId === undefined)
            throw new Error(`No parent recorded for "${formElementId}"`);

        // Remove from old parent (mutating the LIVE children array, not a copy)
        const oldParentChildren = this.liveChildrenOf(oldParentId);
        const oldIdx = oldParentChildren.indexOf(element.uid);
        if (oldIdx === -1)
            throw new Error(
                `Element "${formElementId}" not found in its recorded parent`
            );
        oldParentChildren.splice(oldIdx, 1);

        // Insert into target (delete first keeps the order correct when the
        // target is the old parent itself)
        const targetChildren = this.liveChildrenOf(targetContainer.uid);
        const insertIndex = Math.min(newIndex, targetChildren.length);
        targetChildren.splice(insertIndex, 0, element.uid);

        // Update parentIndex
        this.parentIndex.set(formElementId, targetContainer.uid);
    }

    /**
     * Remove an element (and all its descendants) from the tree and indexes.
     */
    deleteElement(formElementId: string): void {
        const element = this.getElementById(formElementId);
        if (!element) throw new Error(`Element "${formElementId}" not found`);

        const parentId = this.getParentId(formElementId);
        if (parentId === undefined)
            throw new Error(`No parent recorded for "${formElementId}"`);

        const parentChildren = this.liveChildrenOf(parentId);
        const idx = parentChildren.indexOf(element.uid);
        if (idx !== -1) parentChildren.splice(idx, 1);

        this.removeFromIndexes(element);
    }

    /**
     * Insert a new (or detached) element into containerElement at newIndex.
     * Also indexes all descendants if element is a ContainerElement.
     *
     * NOTE: containerElement can be a ContainerElement or the root Form.
     *       Pass this.root to insert at the top level.
     *       Children of a freshly built container that are not yet part of this
     *       FormDefinition must be inserted first (or the whole subtree passed
     *       to the constructor).
     */
    insertElement(
        formElement: FormElement,
        containerElement: ContainerElement | Form,
        newIndex: number
    ): void {
        const children = containerElement.children;
        children.splice(newIndex, 0, formElement.uid);

        // Index the inserted element itself
        this.nodesIndex.set(formElement.uid, formElement);
        this.parentIndex.set(formElement.uid, containerElement.uid);
        this.indexElementDependency(formElement);

        // If it already carries children, index them too
        if (formElement instanceof ContainerElement) {
            this.buildParentIndexes(formElement.children, formElement.uid);
        }
    }

    /**
     * Add a Dependency to a DependencyGroup and update the indexes:
     * the dependency is indexed as a first-class entity, the group's
     * `dependencies` uid list grows, and the elementDependencyGraph records
     * the source element.
     */
    addDependencyToGroup(
        dependency: Dependency,
        dependencyGroupId: string
    ): void {
        const group = this.getDependency_Group(dependencyGroupId);
        if (!(group instanceof DependencyGroup)) {
            throw new Error(
                `Parent DependencyGroup "${dependencyGroupId}" not found`
            );
        }
        this.dependencyIndex.set(dependency.uid, dependency);
        this.dependencyParentIndex.set(dependency.uid, dependencyGroupId);

        // Update the elementDependencyGraph for the source element
        const sourceId = dependency.data.sourceId;
        if (!this.elementDependencyGraph.has(sourceId)) {
            this.elementDependencyGraph.set(sourceId, []);
        }
        const sourceDependencies = this.elementDependencyGraph.get(sourceId);
        if (
            sourceDependencies &&
            !sourceDependencies.includes(dependency.uid)
        ) {
            sourceDependencies.push(dependency.uid);
        }

        // add the dependency to the parent DependencyGroup's dependencies array
        group.dependencies.push(dependency.uid);
    }

    /**
     * Add a DependencyGroup to the document and attach it to a parent:
     * `parentId` is either an element uid (the group becomes that element's
     * dependencyGroup) or a DependencyGroup uid (the group is nested).
     */
    addDependencyGroup(
        dependencyGroup: DependencyGroup,
        parentId: string
    ): void {
        const parentElement = this.getElementById(parentId);
        const parentGroup = this.getDependency_Group(parentId);
        if (parentElement instanceof FormElement) {
            parentElement.data.dependencyGroup = dependencyGroup.uid;
        } else if (parentGroup instanceof DependencyGroup) {
            parentGroup.dependencies.push(dependencyGroup.uid);
        } else {
            throw new Error(
                `Parent "${parentId}" is neither a FormElement nor a DependencyGroup`
            );
        }
        this.dependencyIndex.set(dependencyGroup.uid, dependencyGroup);
        this.dependencyParentIndex.set(dependencyGroup.uid, parentId);
    }

    deleteDependency_Group(dependencyId: string): void {
        const dependency = this.getDependency_Group(dependencyId);
        if (!dependency)
            throw new Error(`Dependency "${dependencyId}" not found`);

        const parentId = this.dependencyParentIndex.get(dependencyId);
        if (parentId) {
            const parentGroup = this.getDependency_Group(parentId);
            if (parentGroup instanceof DependencyGroup) {
                // delete from the parent group's dependency list
                const idx = parentGroup.dependencies.indexOf(dependencyId);
                if (idx !== -1) parentGroup.dependencies.splice(idx, 1);
            } else {
                // parent is a FormElement — clear its dependencyGroup reference
                const parentElement = this.getElementById(parentId);
                if (parentElement instanceof FormElement) {
                    delete parentElement.data.dependencyGroup;
                }
            }
        }

        this.removeDependencySubtree(dependencyId);
    }

    /**
     * Attach or replace a dependency group on an element.
     * Pass undefined to remove the dependency group.
     * The group (and any nested groups it references) is indexed like a
     * first-class entity — the same way elements are indexed.
     */
    setDependency(
        formElement: FormElement,
        dependencyGroup: DependencyGroup | undefined
    ): void {
        if (dependencyGroup) {
            formElement.data.dependencyGroup = dependencyGroup.uid;
            if (!this.dependencyIndex.has(dependencyGroup.uid)) {
                this.indexDependencies([dependencyGroup]);
            }
            this.dependencyParentIndex.set(
                dependencyGroup.uid,
                formElement.uid
            );
        } else {
            const oldGroupUid = formElement.data.dependencyGroup;
            delete formElement.data.dependencyGroup;
            if (oldGroupUid) {
                this.dependencyParentIndex.delete(oldGroupUid);
            }
        }
    }

    /**
     * Shallow-merge changes into an element's data.
     * Changing `uid` is not supported — children arrays reference uids, so a
     * rename would require re-keying the whole tree (TODO).
     */
    updateElement<T extends FormElement | Form>(
        element: T,
        changes: Partial<T['data']>
    ): void {
        if ('uid' in changes && changes.uid !== element.uid) {
            throw new Error(
                "Changing an element's uid via updateElement is not yet implemented. " +
                    'Update nodesIndex, parentIndex, and dependencyGraph keys manually.'
            );
        }
        Object.assign(element.data, changes);
    }

    // ─── Serialisation ────────────────────────────────────────────────────────────

    /**
     * Serialise the entire form tree as plain data. Save this to the database.
     * Reconstruct with: FormDefinition.fromJSON(savedJson)
     */
    toJSON(): object {
        return {
            root: this.root,
            elements: Object.fromEntries(this.nodesIndex),
            dependencies: Object.fromEntries(this.dependencyIndex),
        };
    }

    /**
     * Rebuild a FormDefinition from a previously serialised JSON string.
     * Accepts both the current model (Dependency entities with uids) and the
     * legacy model (inline `deps` + nested `depGroups` on DependencyGroups),
     * which is migrated on the fly.
     */
    static fromJSON(json: string): FormDefinition {
        const raw = JSON.parse(json);
        if (!('root' in raw) || !('elements' in raw)) {
            throw new Error(
                "Invalid FormDefinition JSON: missing 'root' or 'elements' property"
            );
        }
        const formParseResult = Form.schema.safeParse(raw.root);
        if (!formParseResult.success) {
            throw new Error(
                `Invalid Form data: ${formParseResult.error.message}`
            );
        }
        const form = new Form(formParseResult.data);
        const elements: FormElement[] = [];
        for (const [id, rawElement] of Object.entries(raw.elements)) {
            if (
                !rawElement ||
                typeof rawElement !== 'object' ||
                !('type' in rawElement)
            ) {
                throw new Error(
                    `Invalid FormElement data for element "${id}": missing or invalid "type" property`
                );
            }
            if (typeof rawElement.type !== 'string') {
                throw new Error(
                    `Invalid FormElement data for element "${id}": "type" must be a string`
                );
            }
            const ctor = FormElementRegistry.get(rawElement.type);
            if (!ctor)
                throw new Error(
                    `Unknown FormElement type "${rawElement.type}" for element "${id}"`
                );
            const parseResult = ctor.schema.safeParse(rawElement);
            if (!parseResult.success) {
                throw new Error(
                    `Invalid FormElement data for element "${id}": ${parseResult.error.message}`
                );
            }
            // data-driven constructors: pass the validated data straight through
            const instance = new ctor(parseResult.data);
            elements.push(instance);
        }
        const dependencies: (Dependency | DependencyGroup)[] = [];
        for (const [id, rawDependency] of Object.entries(
            migrateLegacyDependencies(raw.dependencies ?? {})
        )) {
            if (!rawDependency || typeof rawDependency !== 'object') {
                throw new Error(
                    `Invalid Dependency data for dependency "${id}"`
                );
            }
            if ('relation' in rawDependency) {
                const parseResult =
                    DependencyGroup.schema.safeParse(rawDependency);
                if (!parseResult.success) {
                    throw new Error(
                        `Invalid DependencyGroup data for group "${id}": ${parseResult.error.message}`
                    );
                }
                dependencies.push(new DependencyGroup(parseResult.data));
            } else {
                const parseResult = Dependency.schema.safeParse(rawDependency);
                if (!parseResult.success) {
                    throw new Error(
                        `Invalid Dependency data for dependency "${id}": ${parseResult.error.message}`
                    );
                }
                dependencies.push(new Dependency(parseResult.data));
            }
        }
        return new FormDefinition(form, elements, dependencies);
    }
}

/**
 * Converts a legacy serialized dependency map (groups with inline `deps`
 * arrays + nested `depGroups` uids) into the current model: every inline
 * dependency becomes its own Dependency entity with a fresh uid, nested
 * groups are referenced via the `dependencies` uid list. Entities that
 * already match the current model are passed through untouched.
 */
function migrateLegacyDependencies(
    dependencies: Record<string, unknown>
): Record<string, unknown> {
    const migrated: Record<string, unknown> = {};
    for (const [id, raw] of Object.entries(dependencies)) {
        if (typeof raw !== 'object' || raw === null) {
            migrated[id] = raw;
            continue;
        }
        const entry = raw as Record<string, unknown>;
        if (!('deps' in entry) && !('depGroups' in entry)) {
            migrated[id] = entry;
            continue;
        }
        // legacy DependencyGroup: convert inline deps into Dependency entities
        const deps = Array.isArray(entry.deps) ? entry.deps : [];
        const depGroups = Array.isArray(entry.depGroups) ? entry.depGroups : [];
        const dependenciesList: string[] = [];
        for (const dep of deps) {
            if (typeof dep !== 'object' || dep === null) continue;
            const uid = globalThis.crypto.randomUUID();
            dependenciesList.push(uid);
            migrated[uid] = {
                uid,
                id: `dep_${(dep as Record<string, unknown>).sourceId ?? 'unknown'}`,
                ...dep,
            };
        }
        dependenciesList.push(...depGroups.map(String));
        const {
            deps: _legacyDeps,
            depGroups: _legacyDepGroups,
            ...rest
        } = entry;
        migrated[id] = { ...rest, dependencies: dependenciesList };
    }
    return migrated;
}
