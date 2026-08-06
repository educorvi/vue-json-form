import type { DependencyGroup } from './dependency';
import { Form } from './form';
import { FormElement } from './form-element';
import { ContainerElement } from './container';
import { FormElementRegistry } from '../registry';
import type { JSONSchema, UISchema } from '@educorvi/vue-json-form-schemas';


/**
 * FormDefinition wraps a Form tree and maintains three indexes for O(1) access
 * and cheap mutation without tree traversal on every operation.
 *
 *  nodesIndex      — elementId → FormElement instance
 *  parentIndex     — elementId → parentId  (root.uid for top-level children)
 *  dependencyGraph — elementId → Dependency (only elements that have one) TODO???????????????????
 */
export class FormDefinition {
  readonly nodesIndex = new Map<string, FormElement>();
  readonly parentIndex = new Map<string, string>(); // elementId → parentId
  readonly dependencyGraph = new Map<string, DependencyGroup>();

  constructor(public readonly root: Form, children: FormElement[] = []) {
    this.buildIndexes(children, root.uid);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private buildIndexes(children: FormElement[], parentId: string): void {
    for (const child of children) {
      this.nodesIndex.set(child.uid, child);
      this.parentIndex.set(child.uid, parentId);
      if (child.dependencyGroup) {
        this.dependencyGraph.set(child.uid, child.dependencyGroup); //??????????TODO
      }
      if (child instanceof ContainerElement) {
        this.buildIndexes(this.childrenOf(child.uid), child.uid);
      }
    }
  }

  private removeFromIndexes(element: FormElement): void {
    this.nodesIndex.delete(element.uid);
    this.parentIndex.delete(element.uid);
    this.dependencyGraph.delete(element.uid);    // TODO ??????????????? auch alle die die id dann in dependencygroup haben?
    if (element instanceof ContainerElement) {
      for (const childId of element.children) {
        const child = this.getElementById(childId);
        if (child) {
          this.removeFromIndexes(child);
        } else {
          throw new Error(`Child element with uid "${childId}" not found in nodesIndex`);
        }
      }
    }
  }

  /** Returns the children array of the given parent (Form or ContainerElement). */
  private childrenOf(parentId: string): FormElement[] {

    let children = parentId === this.root.uid ? this.root.children : undefined;
    if (!children) {
      const parent = this.getElementById(parentId);
      if (!(parent instanceof ContainerElement)) {
        throw new Error(`Parent "${parentId}" is not a ContainerElement`);
      }
      children = parent.children;
    }

    return !children ? [] : children.map((childId) => {
          const childElement = this.getElementById(childId);
          if (!childElement) {
            throw new Error(`Child element with uid "${childId}" not found in nodesIndex`);
          }
          return childElement;
        });
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



  /**
   * Move an existing element to a new position inside targetContainer.
   * Updates parentIndex, removes from old parent's children, inserts at newIndex.
   */
  moveElement(
    formElementId: string,
    targetContainer: ContainerElement,
    newIndex: number,
  ): void {
    const element = this.getElementById(formElementId);
    if (!element) throw new Error(`Element "${formElementId}" not found`);

    const oldParentId = this.getParentId(formElementId);
    if (oldParentId === undefined) throw new Error(`No parent recorded for "${formElementId}"`);

    // Remove from old parent
    const oldChildren = this.childrenOf(oldParentId);
    const oldIdx = oldChildren.indexOf(element);
    if (oldIdx === -1) throw new Error(`Element "${formElementId}" not found in its recorded parent`);
    oldChildren.splice(oldIdx, 1);

    // Insert into target
    targetContainer.children.splice(newIndex, 0, element.uid);

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
    if (parentId === undefined) throw new Error(`No parent recorded for "${formElementId}"`);

    const parentChildren = this.childrenOf(parentId);
    const idx = parentChildren.indexOf(element);
    if (idx !== -1) parentChildren.splice(idx, 1);

    this.removeFromIndexes(element);
  }

  /**
   * Insert a new (or detached) element into containerElement at newIndex.
   * Also indexes all descendants if element is a ContainerElement.
   *
   * NOTE: containerElement can be a ContainerElement or the root Form.
   *       Pass this.root to insert at the top level.
   */
  insertElement(
    formElement: FormElement,
    containerElement: ContainerElement | Form,
    newIndex: number,
  ): void {
    const children = containerElement.children;
    children.splice(newIndex, 0, formElement.uid);

    // Index the inserted element itself
    this.nodesIndex.set(formElement.uid, formElement);
    this.parentIndex.set(formElement.uid, containerElement.uid);
    if (formElement.dependencyGroup) { // TODO???????????????
      this.dependencyGraph.set(formElement.uid, formElement.dependencyGroup);
    }

    // If it already carries children, index them too
    if (formElement instanceof ContainerElement) {
      this.buildIndexes([formElement], containerElement.uid);
    }
  }

  /**
   * Attach or replace a dependency on an element.
   * Pass undefined to remove the dependency group.
   */
  // TODO ???????????????????????????
  setDependency(formElement: FormElement, dependencyGroup: DependencyGroup | undefined): void {
    formElement.dependencyGroup = dependencyGroup;
    if (dependencyGroup) {
      this.dependencyGraph.set(formElement.uid, dependencyGroup);
    } else {
      this.dependencyGraph.delete(formElement.uid);
    }
  }

  /**
   * Shallow-merge changes into an element.
   * Updating `id` requires re-keying the indexes; a TODO is left below.
   */
  updateElement<T extends FormElement>(
    element: T,
    changes: Partial<Omit<T, 'uid'>>,
  ): void {
    const oldId = element.uid;
    Object.assign(element, changes);

    if ('uid' in changes && changes.uid !== oldId) {
      // TODO: re-key nodesIndex (delete old, set new), update parentIndex for
      //       all direct children whose parentIndex value equals oldId, and
      //       update dependencyGraph if the key changes.
      throw new Error(
        'Changing an element\'s uid via updateElement is not yet implemented. ' +
        'Update nodesIndex, parentIndex, and dependencyGraph keys manually.',
      );
    }
  }

  // ─── Serialisation ────────────────────────────────────────────────────────────

  /**
   * Serialise the entire form tree. Save this string to the database.
   * Reconstruct with: FormDefinition.fromJSON(savedString)
   */
  toJSON(): object {
    return {
      // version: this.version or timestamp or whatever TODO
      root: this.root,
      elements: Object.fromEntries(this.nodesIndex),
    }
  }

  /** Rebuild a FormDefinition from a previously serialised JSON string. */
  static fromJSON(json: string): FormDefinition {
    const raw = JSON.parse(json);
    if (!("root" in raw) || !("elements" in raw)) {
      throw new Error("Invalid FormDefinition JSON: missing 'root' or 'elements' property");
    }
    const formParseResult = Form.schema.safeParse(raw.root);
    if (!formParseResult.success) {
      throw new Error(`Invalid Form data: ${formParseResult.error.message}`);
    }
    const form = formParseResult.data;

    const elements: FormElement[] = [];
    for (const [id, rawElement] of Object.entries(raw.elements)) {
      if (!rawElement || typeof rawElement !== 'object' || !('type' in rawElement)) {
        throw new Error(`Invalid FormElement data for element "${id}": missing or invalid "type" property`);
      }
      if (typeof rawElement.type !== 'string') {
        throw new Error(`Invalid FormElement data for element "${id}": "type" must be a string`);
      }
      const ctor = FormElementRegistry.get(rawElement.type);
      if (!ctor) throw new Error(`Unknown FormElement type "${rawElement.type}" for element "${id}"`);
      const parseResult = ctor.schema.safeParse(rawElement);
      if (!parseResult.success) {
        throw new Error(`Invalid FormElement data for element "${id}": ${parseResult.error.message}`);
      }
      const instance = new ctor("");
      Object.assign(instance, rawElement);
      elements.push(instance);
    }
    return new FormDefinition(form, elements);
  }

  fromJsonSchemaAndUiSchema(jsonSchema: JSONSchema, uiSchema: UISchema, required: boolean=false): FormElement {
    const type = jsonSchema.type ? jsonSchema.type : "object";
    if (typeof type !== "string") throw new Error("Cannot determine FormElement type from JSON Schema: " + JSON.stringify(jsonSchema));

    const Ctor = FormElementRegistry.get(type);
    if (!Ctor) throw new Error("Unknown FormElement type: " + type);
    // TODOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
    // const formElement = Ctor.fromJsonSchemaAndUiSchema(jsonSchema, uiSchema, required);

    // // Recursively hydrate children for ContainerElements
    // if (formElement instanceof ContainerElement) {
    //     let children_schema: JSONSchema = {};
    //     if (jsonSchema.properties) {
    //         children_schema = jsonSchema.properties;
    //         formElement.children = Object.keys(children_schema).map((key) => {
    //         const childJsonSchema: JSONSchema = children_schema[key];
    //         const childUiSchema = (uiSchema as any).options?.descendantControlOverrides?.[key] || {};
    //         return fromJsonSchemaAndUiSchema(childJsonSchema, childUiSchema, required);
    //     }).filter((child) => child !== null) as FormElement[];
    //     } else if (jsonSchema.items && typeof jsonSchema.items === "object") {
    //         children_schema = jsonSchema.items;
    //         formElement.children = [fromJsonSchemaAndUiSchema(children_schema, (uiSchema as any).options?.descendantControlOverrides || {}, required)] as FormElement[];
    //     }
    // }

    return formElement;
  }


}
