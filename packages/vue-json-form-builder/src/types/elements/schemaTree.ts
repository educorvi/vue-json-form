/**
 * schemaTree.ts
 *
 * Pure utility for building a labelled tree from a JSON Schema.
 * Used by SchemaFieldPicker to let users select a field path
 * for ShowOn rules (dot-separated, e.g. "address.city").
 */

import type { JSONSchema } from '@educorvi/vue-json-form-schemas';

export interface SchemaTreeNode {
    /** The dot-separated path from the root (e.g. "address.city"). */
    path: string;
    /** Display label: schema `title` if set, otherwise the property key. */
    label: string;
    /** JSON Schema type string (string, number, boolean, object, array, …). */
    type: string;
    /** Child nodes for object properties. */
    children?: SchemaTreeNode[];
}

/**
 * Build a flat-keyed tree from a JSON Schema.
 *
 * @param schema   A JSON Schema object whose `properties` are iterated.
 * @param prefix   Dot-separated path prefix for nested calls (leave empty for root).
 */
export function buildSchemaTree(
    schema: JSONSchema,
    prefix = ''
): SchemaTreeNode[] {
    const props = schema.properties as Record<string, JSONSchema> | undefined;
    if (!props) return [];

    return Object.entries(props).map(([key, prop]) => {
        const p = prop as Record<string, unknown>;
        const path = prefix ? `${prefix}.${key}` : key;
        const label = (p.title as string | undefined) ?? key;
        const type = (p.type as string | undefined) ?? 'any';

        const node: SchemaTreeNode = { path, label, type };

        if (type === 'object' && p.properties) {
            node.children = buildSchemaTree(prop as JSONSchema, path);
        }

        return node;
    });
}

/** Map a JSON Schema type to a PrimeIcon class string. */
export function iconForSchemaType(type: string): string {
    switch (type) {
        case 'object':
            return 'bi bi-sitemap';
        case 'array':
            return 'bi bi-list';
        case 'boolean':
            return 'bi bi-check-square';
        case 'number':
        case 'integer':
            return 'bi bi-123';
        default:
            return 'bi bi-pencil';
    }
}
