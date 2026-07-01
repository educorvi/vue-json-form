/**
 * controlFields.ts
 *
 * Pure utility for collecting all addressable form fields from the UI schema
 * element tree. Used to populate field-path selectors (e.g. ShowOn, conditional
 * visibility rules).
 *
 * Traverses the live element tree (rootLayout) rather than the JSON Schema so
 * only fields that are actually in the form are listed.
 *
 * Two representations are provided:
 *  - ControlFieldNode: a hierarchical tree (Object/Array introduce branches)
 *  - flattenFieldNodes: a flat list derived from the tree (for autocomplete etc.)
 */

import type { JSONSchema } from '@educorvi/vue-json-form-schemas';
import type {
    FormElement,
    ControlElement,
    ObjectElement,
    ArrayElement,
    LayoutElement,
    WizardElement,
} from '../formTypes';
import { iconForSchemaType } from './schemaTree';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ControlFieldNode {
    /** Full JSON Pointer scope (without leading `#`), e.g. `/properties/a/properties/b`. */
    scope: string;
    /** Dot-separated path for ShowOn (e.g. `"a.b"`). This is the value to emit. */
    path: string;
    /** Human-readable label: JSON Schema `title` if set, otherwise the property key. */
    title: string;
    /** PrimeIcons class derived from the JSON Schema type. */
    icon: string;
    /** JSON Schema type string (`string`, `number`, `object`, `array`, …). */
    schemaType: string;
    /** Nested children for Object containers. Absent for leaf fields. */
    children?: ControlFieldNode[];
}

// ─── Scope / path helpers ─────────────────────────────────────────────────────

/**
 * Convert a full JSON Pointer scope like `/properties/a/properties/b`
 * to the dot-separated path format used by ShowOn: `"a.b"`.
 * Handles an optional leading `#` prefix.
 */
export function scopeToDotPath(scope: string): string {
    const s = scope.startsWith('#') ? scope.slice(1) : scope;
    return s.replace(/^\/properties\//, '').replace(/\/properties\//g, '.');
}

/**
 * Navigate a JSON Schema to the sub-schema at a full scope path.
 *
 * Example: `resolveSchemaAtScope("/properties/address/properties/city", root)`
 *   → `root.properties.address.properties.city`
 *
 * Returns `undefined` if any segment along the path is missing.
 */
export function resolveSchemaAtScope(
    fullScope: string,
    rootSchema: JSONSchema
): JSONSchema | undefined {
    const s = fullScope.startsWith('#') ? fullScope.slice(1) : fullScope;
    // Split by "/properties/" — first element is empty string, filter it out
    const segments = s.split('/properties/').filter(Boolean);
    let current: JSONSchema | undefined = rootSchema;
    for (const seg of segments) {
        if (!current) return undefined;
        const props = current.properties as
            | Record<string, JSONSchema>
            | undefined;
        if (!props) return undefined;
        current = props[seg];
    }
    return current;
}

/**
 * Resolve the display title for a field given its full scope and root JSON Schema.
 * Returns the JSON Schema `title` if present, otherwise the last path segment (the key).
 */
export function resolveFieldTitle(
    fullScope: string,
    jsonSchema: JSONSchema
): string {
    const key = fullScope.split('/').pop() ?? fullScope;
    const entry = resolveSchemaAtScope(fullScope, jsonSchema);
    return (
        ((entry as Record<string, unknown> | undefined)?.title as string) ?? key
    );
}

// ─── Tree builder ─────────────────────────────────────────────────────────────

function buildNodes(
    elements: FormElement[],
    jsonSchema: JSONSchema,
    scopePrefix: string
): ControlFieldNode[] {
    const nodes: ControlFieldNode[] = [];

    for (const el of elements) {
        switch (el.type) {
            case 'Control': {
                const ctrl = el as ControlElement;
                const fullScope = scopePrefix
                    ? `${scopePrefix}${ctrl.scope}`
                    : ctrl.scope;
                const key = ctrl.scope.split('/').pop() ?? ctrl.scope;
                const entry = resolveSchemaAtScope(fullScope, jsonSchema);
                const schemaType =
                    ((entry as Record<string, unknown> | undefined)
                        ?.type as string) ?? 'string';
                const title =
                    ((entry as Record<string, unknown> | undefined)
                        ?.title as string) ?? key;
                nodes.push({
                    scope: fullScope,
                    path: scopeToDotPath(fullScope),
                    title,
                    icon: iconForSchemaType(schemaType),
                    schemaType,
                });
                break;
            }

            case 'Object': {
                const obj = el as ObjectElement;
                const objScope = `${scopePrefix}/properties/${obj.key}`;
                const entry = resolveSchemaAtScope(objScope, jsonSchema);
                const title =
                    (obj.title as string | undefined) ??
                    ((entry as Record<string, unknown> | undefined)
                        ?.title as string) ??
                    obj.key;
                const children = buildNodes(obj.elements, jsonSchema, objScope);
                nodes.push({
                    scope: objScope,
                    path: scopeToDotPath(objScope),
                    title,
                    icon: 'bi bi-sitemap',
                    schemaType: 'object',
                    ...(children.length ? { children } : {}),
                });
                break;
            }

            case 'Array': {
                const arr = el as ArrayElement;
                const arrScope = `${scopePrefix}/properties/${arr.key}`;
                const entry = resolveSchemaAtScope(arrScope, jsonSchema);
                const title =
                    (arr.title as string | undefined) ??
                    ((entry as Record<string, unknown> | undefined)
                        ?.title as string) ??
                    arr.key;
                nodes.push({
                    scope: arrScope,
                    path: scopeToDotPath(arrScope),
                    title,
                    icon: 'bi bi-list',
                    schemaType: 'array',
                    // Array children are not addressable via dot-path in ShowOn
                });
                break;
            }

            default: {
                // Layout containers (Group, VerticalLayout, HorizontalLayout) are
                // transparent for field-path purposes — recurse without changing prefix.
                if (
                    'elements' in el &&
                    Array.isArray((el as LayoutElement).elements)
                ) {
                    nodes.push(
                        ...buildNodes(
                            (el as LayoutElement).elements,
                            jsonSchema,
                            scopePrefix
                        )
                    );
                }
                // ButtonElement, ButtonGroupElement, DividerElement, HTMLElement_ — skip
                break;
            }
        }
    }

    return nodes;
}

/**
 * Traverse the entire form element tree and return a hierarchical list of all
 * addressable fields (Controls, Objects, Arrays) with their scope, dot-path,
 * title, and icon.
 *
 * - Controls → leaf nodes
 * - Objects  → branch nodes whose children are the nested fields
 * - Arrays   → leaf nodes (item fields are not separately addressable in ShowOn)
 * - Layouts  → transparent containers (no node, children are promoted)
 * - Wizards  → pages are transparent (no node, children are promoted)
 *
 * @param rootLayout  The root LayoutElement or WizardElement from the store.
 * @param jsonSchema  The root JSON Schema (used to resolve titles and types).
 */
export function buildFieldTree(
    rootLayout: FormElement,
    jsonSchema: JSONSchema
): ControlFieldNode[] {
    if (rootLayout.type === 'Wizard') {
        const wizard = rootLayout as WizardElement;
        return wizard.pages.flatMap((page) =>
            buildNodes(page.elements, jsonSchema, '')
        );
    }
    if ('elements' in rootLayout) {
        return buildNodes(
            (rootLayout as LayoutElement).elements,
            jsonSchema,
            ''
        );
    }
    return [];
}

/**
 * Flatten a `ControlFieldNode` tree into a depth-first ordered list of leaf
 * and branch nodes (branch nodes appear before their children).
 * Useful for autocomplete inputs that need a flat array of options.
 */
export function flattenFieldNodes(
    nodes: ControlFieldNode[]
): ControlFieldNode[] {
    const out: ControlFieldNode[] = [];
    for (const n of nodes) {
        out.push(n);
        if (n.children) out.push(...flattenFieldNodes(n.children));
    }
    return out;
}
