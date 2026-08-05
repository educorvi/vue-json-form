import type { FormDefinition } from './form-definition';
import type { JSONSchema, Control, HTMLRenderer, ShowOnProperty } from '@educorvi/vue-json-form-schemas';
import type { DependencyGroup } from './dependency';
import { FormElement } from './form-element';
import { getBaseJsonSchema } from '../utils';

/**
 * SchemaGenerator turns a FormDefinition into JSON Schema + UI Schema pairs.
 *
 * Typical usage:
 *   const generator = new SchemaGenerator(formDefinition);
 *   const jsonSchema = generator.generateJsonSchema(rootElementId);
 *   const uiSchema  = generator.generateUiSchema(rootElementId);
 *
 * Each FormElement subclass delegates back to this generator via
 * element.toJsonSchema(generator, path) and element.toUiSchema(generator, path).
 * ContainerElement subclasses call generator.generate(child) for each child.
 */
interface GeneratorHelperAttributes {
  lastDependencyGroups: DependencyGroup[];
  allOf?: JSONSchema["allOf"];
}

export class SchemaGenerator {
  readonly document: FormDefinition;
  generatorHelperAttributes: GeneratorHelperAttributes;

  constructor(document: FormDefinition) {
    this.document = document;
    this.generatorHelperAttributes = {
      lastDependencyGroups: [],
      allOf: []
    };
  }

  // ─── Helper Methods ───────────────────────
  addLastDependencyGroup(dependencyGroup: DependencyGroup): void {
    this.generatorHelperAttributes.lastDependencyGroups.push(dependencyGroup);
  }

  removeLastDependencyGroup(): void {
    this.generatorHelperAttributes.lastDependencyGroups.pop();
  }

  getLastDependencyGroup(): DependencyGroup | undefined {
    const lastIndex = this.generatorHelperAttributes.lastDependencyGroups.length - 1;
    if (lastIndex < 0) return undefined;
    return this.generatorHelperAttributes.lastDependencyGroups[lastIndex];
  }

  addToAllOf(allOf: JSONSchema[]): void {
    if (!this.generatorHelperAttributes.allOf) {
      this.generatorHelperAttributes.allOf = [];
    }
    this.generatorHelperAttributes.allOf = this.generatorHelperAttributes.allOf.concat(...allOf);
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  /**
   * Generate the JSON Schema fragment for the element with the given id.
   * If path is omitted, it is derived from the parentIndex.
   */
  generateJsonSchema(elementId: string, path?: string[]): object {
    const element = this.document.nodesIndex.get(elementId);
    if (!element) throw new Error(`Element "${elementId}" not found in nodesIndex`);
    const resolvedPath = path ?? this.getPath(elementId);
    return element.toJsonSchema(this, resolvedPath);
  }

  /**
   * Generate the UI Schema fragment for the element with the given id.
   * If path is omitted, it is derived from the parentIndex.
   */
  generateUiSchema(elementId: string, path?: string[]): object {
    const element = this.document.nodesIndex.get(elementId);
    if (!element) throw new Error(`Element "${elementId}" not found in nodesIndex`);
    const resolvedPath = path ?? this.getPath(elementId);
    return element.toUiSchema(this, resolvedPath);
  }

  /**
   * Convenience method called by ContainerElement.toJsonSchema for its children.
   * generates the JSON Schema properties and required list for the given children.
   * adds the allofs to the generatorHelperAttributes.allOf array.
   */
  generateJsonSchemaForElements(childrenIds: string[], scope: string[]): {childrenJsonSchema: JSONSchema["properties"], requiredList: string[]} {
    const schema: JSONSchema["properties"] = {};
    const requiredList: string[] = [];
    const allOf = [];

    for (const childId of childrenIds) {
        const child = this.document.getElementById(childId);
        if (!child) throw new Error(`Child element "${childId}" not found in nodesIndex`);
        const childSchema = child.toJsonSchema(this, scope);
        if (childSchema === undefined || childSchema === null || Object.keys(childSchema).length === 0) {
            continue;
        }
        schema[childId] = childSchema;

        // check if child has the attribute required and if it is true
        if ((child as any).required === true) {
            requiredList.push(childId);
        }

        if (child.dependencyGroup) {
          this.addLastDependencyGroup(child.dependencyGroup);
        }
        if (this.getLastDependencyGroup() !== undefined) {
            const allOfItem: JSONSchema = {
                [childId]: this.getLastDependencyGroup()!.toJsonSchema(this, [...scope, childId]),
            }
            allOf.push(allOfItem);
        }
    }

    this.addToAllOf(allOf);
    return {childrenJsonSchema: schema, requiredList: requiredList};
  }

  /**
   * Convenience method called by ContainerElement.toUiSchema for its children.
   */
  generateUiSchemaForElements(childrenIds: string[], scope: string[]): (Control | HTMLRenderer)[] {
    return childrenIds.map(childId => {
      const child = this.document.getElementById(childId);
      if (!child) throw new Error(`Child element "${childId}" not found in nodesIndex`);
      return child.toUiSchema(this, scope);
    });
  }

  // ─── Path helpers ─────────────────────────────────────────────────────────────

  /**
   * Build the path from the form root (exclusive) down to elementId (inclusive).
   * Returns an ordered array of element ids, e.g. ['containerA', 'containerB', 'leafId'].
   *
   * NOTE: These are raw element ids.  Callers that need a JSON Schema pointer
   * (e.g. "#/properties/containerA/properties/leafId") must convert the path
   * themselves, taking into account whether each ancestor is an ObjectElement
   * or ArrayElement (items.properties vs. properties).
   */
  getPath(elementId: string): string[] {
    const path: string[] = [];
    let currentId: string | undefined = elementId;

    while (currentId !== undefined && currentId !== this.document.root.id) {
      path.unshift(currentId);
      currentId = this.document.parentIndex.get(currentId);
    }

    return path;
  }

  /**
   * Convert a path of element ids to a JSON Schema pointer string.
   *
   * TODO: the exact conversion depends on whether each ancestor is an
   *       ObjectElement (#/properties/{id}) or ArrayElement (#/items/properties/{id}).
   *       Implement this once the target schema format is finalised.
   */
  pathToSchemaPointer(_path: string[]): string {
    // TODO: walk each element in _path, look it up in nodesIndex, and build
    //       the correct JSON Pointer segment based on its type.
    throw new Error('pathToSchemaPointer is not yet implemented');
  }

  // ─── Rule generation ──────────────────────────────────────────────────────────

  /**
   * Generate a conditional rule object for the given element based on its
   * registered dependency.  curPath is the schema path of the element itself.
   *
   * Returns an empty object when the element has no dependency.
   *
   * TODO: the exact rule shape depends on the target schema format (jsonforms
   *       "rule" object, ajv "if/then", etc.) – specify and implement accordingly.
   *       The dependencyType ('and' | 'or') is relevant when combining multiple
   *       conditions; this draft assumes a single Dependency per element.
   */
  generateRules(element: FormElement, curPath: string[]): object {
    const dependency = this.document.dependencyGraph.get(element.id);
    if (!dependency) return {};

    const depPath = this.getPath(dependency.source);

    // TODO: convert depPath + dependency.value into a rule/condition expression.
    // Example jsonforms shape (fill in once format is confirmed):
    // return {
    //   rule: {
    //     effect: 'SHOW',
    //     condition: {
    //       scope: this.pathToSchemaPointer(depPath),
    //       schema: { const: dependency.value },
    //     },
    //   },
    // };

    void curPath; // suppress unused warning until implemented
    void depPath;

    return {};
  }

  // ─── Full-form generation ─────────────────────────────────────────────────────

  /**
   * Generate a combined { jsonSchema, uiSchema } pair for the entire form.
   *
   * TODO: decide the top-level JSON Schema wrapper structure (e.g. whether
   *       the form title maps to the root schema title, and whether the root
   *       is always type:"object" with one property per top-level child).
   */
  generateFullSchema(): { jsonSchema: object; uiSchema: object } {
    const properties: Record<string, object> = {};
    const uiElements: object[] = [];

    for (const child of this.document.root.children) {
      properties[child.id] = this.generate(child);
      uiElements.push(this.generateUiSchemaForElement(child));
    }

    const jsonSchema = {
      type: 'object',
      title: this.document.root.title,
      properties,
    };

    // TODO: specify top-level UI schema container type
    const uiSchema = {
      type: 'VerticalLayout',
      elements: uiElements,
    };

    return { jsonSchema, uiSchema };
  }
}
