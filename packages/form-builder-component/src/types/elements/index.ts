/**
 * elements/index.ts
 *
 * Public API for the element type system.
 *
 * Exports every node class and provides the two dispatch functions that replace
 * the old NODE_REGISTRY and FROM_SCHEMA_REGISTRY dictionaries:
 *
 *   wrapElement(el)       — wraps any FormElement in its EditorNode subclass
 *   nodeFromUiSchema(raw) — deserialises a VJF UI-schema element into a FormElement
 *
 * The switch statements here are the single authoritative place where element
 * types are mapped to their classes. Adding a new element type means:
 *   1. Create nodes/MyNode.ts
 *   2. Add a case in each switch below
 */

import type {
    Control,
    Layout,
    Button as VJFButton,
    Buttongroup,
    Divider,
    HTMLRenderer,
    LayoutElement as VJFLayoutElement,
    JSONSchema,
} from '@educorvi/vue-json-form-schemas';

import type {
    FormElement,
    ControlElement,
    LayoutElement,
    ButtonElement,
    DividerElement,
    HTMLElement_,
    ButtonGroupElement,
    ObjectElement,
    ArrayElement,
    WizardElement,
} from '../formTypes';

// ─── Re-exports ───────────────────────────────────────────────────────────────

// export { EditorNode, type DropZoneConfig } from "./EditorNode";
// export { ControlNode } from "./nodes/ControlNode";
// export { LayoutNode } from "./nodes/LayoutNode";
// export { ButtonNode } from "./nodes/ButtonNode";
// export { DividerNode } from "./nodes/DividerNode";
// export { HtmlNode } from "./nodes/HtmlNode";
// export { ButtonGroupNode } from "./nodes/ButtonGroupNode";
// export { ObjectNode } from "./nodes/ObjectNode";
// export { ArrayNode } from "./nodes/ArrayNode";
// export { WizardNode } from "./nodes/WizardNode";

// Import concrete classes for use inside the dispatch functions below
import { ControlNode } from './nodes/ControlNode';
import { LayoutNode } from './nodes/LayoutNode';
import { ButtonNode } from './nodes/ButtonNode';
import { DividerNode } from './nodes/DividerNode';
import { HtmlNode } from './nodes/HtmlNode';
import { ButtonGroupNode } from './nodes/ButtonGroupNode';
import { ObjectNode } from './nodes/ObjectNode';
import { ArrayNode } from './nodes/ArrayNode';
import { WizardNode } from './nodes/WizardNode';
import { EditorNode } from './EditorNode';
import { controlKey } from './schemaResolver';

// ─── Dispatch functions ───────────────────────────────────────────────────────

/**
 * Wrap any FormElement in its corresponding EditorNode subclass.
 *
 * This is the only place that knows the type→class mapping.
 * LayoutNode, ObjectNode, and WizardNode import this function for recursive
 * serialisation; the circular ESM import is safe because wrapElement is only
 * referenced inside method bodies, never at module-initialisation time.
 */
export function wrapElement(el: FormElement): EditorNode {
    switch (el.type) {
        case 'Control':
            return new ControlNode(el as ControlElement);
        case 'VerticalLayout':
        case 'HorizontalLayout':
        case 'Group':
            return new LayoutNode(el as LayoutElement);
        case 'Button':
            return new ButtonNode(el as ButtonElement);
        case 'Divider':
            return new DividerNode(el as DividerElement);
        case 'HTML':
            return new HtmlNode(el as HTMLElement_);
        case 'ButtonGroup':
            return new ButtonGroupNode(el as ButtonGroupElement);
        case 'Object':
            return new ObjectNode(el as ObjectElement);
        case 'Array':
            return new ArrayNode(el as ArrayElement);
        case 'Wizard':
            return new WizardNode(el as WizardElement);
        default:
            return new ControlNode(el as unknown as ControlElement);
    }
}

/**
 * Reconstruct a FormElement from a raw VJF UI-schema element.
 * Pass `jsonSchema` so that Controls pointing to array/object properties
 * are automatically converted to ArrayElement / ObjectElement.
 * HTMLRenderer has an optional `type`, so it is the fallback.
 */
export function nodeFromUiSchema(
    raw: VJFLayoutElement,
    jsonSchema?: JSONSchema
): FormElement {
    switch (raw.type) {
        case 'Control': {
            if (jsonSchema) {
                const key = controlKey((raw as Control).scope);
                const prop = resolveSchemaProperty(
                    (raw as Control).scope,
                    jsonSchema
                );
                if (prop) {
                    if ((prop as any).type === 'array') {
                        return ArrayNode.fromUiSchema(raw as Control, prop);
                    }
                    // Object controls could also be detected here in the future
                }
            }
            return ControlNode.fromUiSchema(raw as Control);
        }
        case 'VerticalLayout':
        case 'HorizontalLayout':
        case 'Group':
            return LayoutNode.fromUiSchema(raw as Layout, jsonSchema);
        case 'Button':
            return ButtonNode.fromUiSchema(raw as VJFButton);
        case 'Buttongroup':
            return ButtonGroupNode.fromUiSchema(raw as Buttongroup);
        case 'Divider':
            return DividerNode.fromUiSchema(raw as Divider);
        default:
            return HtmlNode.fromUiSchema(raw as HTMLRenderer);
    }
}

/**
 * Walk a scope path like `/properties/address/properties/city` through a
 * JSON Schema and return the referenced property schema, or undefined.
 */
function resolveSchemaProperty(
    scope: string,
    rootSchema: JSONSchema
): JSONSchema | undefined {
    const segments = scope.split('/').filter((s) => s.length > 0);
    let current: JSONSchema | undefined = rootSchema;
    for (const seg of segments) {
        if (!current) return undefined;
        if (seg === 'properties') {
            // next segment will be the property name → look it up
            continue;
        }
        const props = current.properties as
            | Record<string, JSONSchema>
            | undefined;
        current = props?.[seg];
    }
    return current;
}

/** Convenience: returns the DropZoneConfig for an element, or null for leaves. */
// export function getDropZone(
//   el: FormElement,
// ): import("./EditorNode").DropZoneConfig | null {
//   return wrapElement(el).dropZone;
// }
