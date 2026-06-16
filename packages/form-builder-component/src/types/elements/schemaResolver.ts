/**
 * schemaResolver.ts
 *
 * Pure, testable functions for resolving a Control's JSON Schema context.
 *
 * Every Control lives in exactly one "schema owner":
 *   - The root JSON schema (for Controls at the top level or inside Layouts)
 *   - An ObjectElement's `properties` map
 *   - An ArrayElement's `items.properties` map
 *
 * This module provides functions to:
 *   - Walk the element tree and locate that owner
 *   - Read / update the schema property for a Control
 *   - Check / toggle the "required" flag
 *   - Migrate a schema property between owners (e.g. on drag between containers)
 *   - Collect all Control elements from a subtree (for cleanup)
 */

import type { JSONSchema } from '@educorvi/vue-json-form-schemas';
import type {
    FormElement,
    ControlElement,
    ObjectElement,
    ArrayElement,
} from '../formTypes';
import { wrapElement } from './index';

// ─── Schema context ──────────────────────────────────────────────────────────

/** The mutable schema "bucket" a Control belongs to. */
export interface SchemaContext {
    /** The `properties` map in which the control's schema entry lives. */
    props: Record<string, JSONSchema>;
    /** The `required` array to which the control's key may belong. */
    required: string[];
    /** The element that owns these props (null = root JSON schema). */
    parentEl: ObjectElement | ArrayElement | null;
}

// ─── Key helpers ──────────────────────────────────────────────────────────────

/** Extract the property key from a Control's scope string. */
export function controlKey(scope: string): string {
    return scope.split('/').pop()!;
}

// ─── Context resolution ──────────────────────────────────────────────────────

/** Build the root SchemaContext from the root JSON schema ref. */
export function rootContext(rootSchema: JSONSchema): SchemaContext {
    return {
        props: (rootSchema.properties as Record<string, JSONSchema>) ?? {},
        required: (rootSchema.required as string[]) ?? [],
        parentEl: null,
    };
}

/**
 * Walk `elements` looking for the Control with `controlId` and return the
 * SchemaContext it belongs to.  Falls back to `ctx` (the current context)
 * when nothing deeper matches.
 */
export function findContext(
    elements: FormElement[],
    controlId: string,
    ctx: SchemaContext
): SchemaContext | null {
    for (const el of elements) {
        if (el._id === controlId && el.type === 'Control') return ctx;
        const node = wrapElement(el);
        const sc = node.schemaContext();
        if (sc) {
            const childCtx: SchemaContext = {
                props: sc.props,
                required: sc.required,
                parentEl: el as ObjectElement | ArrayElement,
            };
            const found = findContext(node.children ?? [], controlId, childCtx);
            if (found) return found;
        } else {
            const children = node.children;
            if (children) {
                const found = findContext(children, controlId, ctx);
                if (found) return found;
            }
        }
    }
    return null;
}

/**
 * Resolve the SchemaContext for a control by id.
 * Convenience wrapper that builds the root context and searches from there.
 */
export function resolveContext(
    controlId: string,
    allElements: FormElement[],
    rootSchema: JSONSchema
): SchemaContext {
    const root = rootContext(rootSchema);
    return findContext(allElements, controlId, root) ?? root;
}

// ─── Read helpers ─────────────────────────────────────────────────────────────

/** Get the JSON Schema entry for a control given its schema context. */
export function getSchema(
    control: ControlElement,
    ctx: SchemaContext
): JSONSchema {
    return ctx.props[controlKey(control.scope)] ?? { type: 'string' };
}

/** Check whether a control is marked required in its owning context. */
export function isRequired(
    control: ControlElement,
    ctx: SchemaContext
): boolean {
    return ctx.required.includes(controlKey(control.scope));
}

// ─── Write helpers ────────────────────────────────────────────────────────────

/** Set or unset the required flag for a control. Returns the new state. */
export function setRequired(
    control: ControlElement,
    ctx: SchemaContext,
    required: boolean,
    rootSchema?: JSONSchema
): boolean {
    const key = controlKey(control.scope);
    if (required) {
        if (!ctx.required.includes(key)) ctx.required.push(key);
    } else {
        const i = ctx.required.indexOf(key);
        if (i >= 0) ctx.required.splice(i, 1);
    }
    // Sync back to the root schema ref if this is the root context
    if (!ctx.parentEl && rootSchema) {
        rootSchema.required = ctx.required;
    }
    return required;
}

/** Merge partial updates into the control's schema property. */
export function updateSchema(
    control: ControlElement,
    ctx: SchemaContext,
    updates: Partial<JSONSchema>
): void {
    const key = controlKey(control.scope);
    ctx.props[key] = { ...(ctx.props[key] ?? {}), ...updates };
}

/** Delete the control's schema property and remove from required. */
export function removeSchema(
    control: ControlElement,
    ctx: SchemaContext
): void {
    const key = controlKey(control.scope);
    delete ctx.props[key];
    const ri = ctx.required.indexOf(key);
    if (ri >= 0) ctx.required.splice(ri, 1);
}

/** Rename a control key in the schema context. Returns new scope string. */
export function renameKey(
    control: ControlElement,
    ctx: SchemaContext,
    newKey: string,
    rootSchema?: JSONSchema
): string {
    const oldKey = controlKey(control.scope);
    if (!newKey || newKey === oldKey) return control.scope;
    if (ctx.props[oldKey]) {
        ctx.props[newKey] = ctx.props[oldKey];
        delete ctx.props[oldKey];
    }
    const wasRequired = ctx.required.includes(oldKey);
    if (wasRequired) {
        ctx.required.splice(ctx.required.indexOf(oldKey), 1);
        ctx.required.push(newKey);
    }
    if (!ctx.parentEl && rootSchema) {
        rootSchema.required = ctx.required;
    }
    return `/properties/${newKey}`;
}

// ─── Migration ────────────────────────────────────────────────────────────────

/**
 * Internal: search the element tree and extract a schema key from whichever
 * container currently holds it (Object.properties or Array.items.properties).
 * Returns the extracted JSONSchema, or undefined if not found anywhere.
 */
function _searchAndExtract(
    schemaKey: string,
    elements: FormElement[]
): JSONSchema | undefined {
    for (const el of elements) {
        if (el.type === 'Object') {
            const props = (el as ObjectElement).properties as
                | Record<string, JSONSchema>
                | undefined;
            if (props?.[schemaKey] !== undefined) {
                const schema = props[schemaKey] as JSONSchema;
                delete props[schemaKey];
                const req = (el as ObjectElement).required as
                    | string[]
                    | undefined;
                if (req) {
                    const i = req.indexOf(schemaKey);
                    if (i >= 0) req.splice(i, 1);
                }
                return schema;
            }
        } else if (el.type === 'Array') {
            const items = (el as ArrayElement).items as JSONSchema | undefined;
            const props = items?.properties as
                | Record<string, JSONSchema>
                | undefined;
            if (props?.[schemaKey] !== undefined) {
                const schema = props[schemaKey] as JSONSchema;
                delete props[schemaKey];
                const req = items?.required as string[] | undefined;
                if (req) {
                    const i = req.indexOf(schemaKey);
                    if (i >= 0) req.splice(i, 1);
                }
                return schema;
            }
        }
        // Recurse into children
        const children = wrapElement(el).children;
        if (children) {
            const found = _searchAndExtract(schemaKey, children);
            if (found) return found;
        }
    }
    return undefined;
}

/**
 * Find a schema key anywhere in the schema hierarchy and remove it from its
 * current location. Checks root first, then all Object/Array containers.
 *
 * This is event-order-independent: it works correctly whether SortableJS fires
 * @add before @remove or vice versa. The caller can then place the schema in
 * the desired new location.
 */
export function extractSchema(
    schemaKey: string,
    allElements: FormElement[],
    rootSchema: JSONSchema
): JSONSchema | undefined {
    // Check root first
    const rootProps = rootSchema.properties as
        | Record<string, JSONSchema>
        | undefined;
    if (rootProps?.[schemaKey] !== undefined) {
        const schema = rootProps[schemaKey] as JSONSchema;
        delete rootProps[schemaKey];
        const req = rootSchema.required as string[] | undefined;
        if (req) {
            const i = req.indexOf(schemaKey);
            if (i >= 0) req.splice(i, 1);
        }
        return schema;
    }
    // Search all containers in the element tree
    return _searchAndExtract(schemaKey, allElements);
}

/**
 * Move a schema property into a container (Object or Array).
 * Extracts the schema from WHEREVER it currently lives (root or any container),
 * then places it in the target. Order-independent with migrateToRoot.
 */
export function migrateToContainer(
    schemaKey: string,
    rootSchema: JSONSchema,
    container: ObjectElement | ArrayElement,
    allElements: FormElement[]
): void {
    const schema = extractSchema(schemaKey, allElements, rootSchema);
    if (!schema) return;

    if (container.type === 'Object') {
        if (!container.properties) container.properties = {};
        (container.properties as Record<string, JSONSchema>)[schemaKey] =
            schema;
    } else if (container.type === 'Array') {
        if (!container.items)
            container.items = { type: 'object', properties: {} };
        const items = container.items as JSONSchema;
        if (!items.properties) items.properties = {};
        (items.properties as Record<string, JSONSchema>)[schemaKey] = schema;
    }
}

/**
 * Move a schema property from a container → root.
 * Safe to call after migrateToContainer has already run (returns silently
 * if the key is no longer in the specified container).
 */
export function migrateToRoot(
    schemaKey: string,
    container: ObjectElement | ArrayElement,
    rootSchema: JSONSchema
): void {
    let schema: JSONSchema | undefined;
    if (container.type === 'Object') {
        const props = container.properties as
            | Record<string, JSONSchema>
            | undefined;
        if (props?.[schemaKey] !== undefined) {
            schema = props[schemaKey] as JSONSchema;
            delete props[schemaKey];
            const req = container.required as string[] | undefined;
            if (req) {
                const i = req.indexOf(schemaKey);
                if (i >= 0) req.splice(i, 1);
            }
        }
    } else if (container.type === 'Array') {
        const items = container.items as JSONSchema | undefined;
        const props = items?.properties as
            | Record<string, JSONSchema>
            | undefined;
        if (props?.[schemaKey] !== undefined) {
            schema = props[schemaKey] as JSONSchema;
            delete props[schemaKey];
            const req = items?.required as string[] | undefined;
            if (req) {
                const i = req.indexOf(schemaKey);
                if (i >= 0) req.splice(i, 1);
            }
        }
    }
    // Only write to root if we actually found/removed it from the container.
    // If migrateToContainer already ran first, props[schemaKey] will be gone
    // and schema will be undefined here — intentional no-op.
    if (schema) {
        if (!rootSchema.properties) rootSchema.properties = {};
        (rootSchema.properties as Record<string, JSONSchema>)[schemaKey] =
            schema;
    }
}

// ─── Tree utilities ───────────────────────────────────────────────────────────

/** Recursively collect all Control elements from a subtree. */
export function collectControls(elements: FormElement[]): ControlElement[] {
    const result: ControlElement[] = [];
    for (const el of elements) {
        if (el.type === 'Control') {
            result.push(el as ControlElement);
        }
        const children = wrapElement(el).children;
        if (children) result.push(...collectControls(children));
    }
    return result;
}

/**
 * Remove all JSON schema entries for controls in a subtree.
 * Used when clearing the form or switching root types.
 */
export function removeAllControlSchemas(
    elements: FormElement[],
    rootSchema: JSONSchema
): void {
    for (const ctrl of collectControls(elements)) {
        const ctx = resolveContext(ctrl._id, elements, rootSchema);
        removeSchema(ctrl, ctx);
    }
}
