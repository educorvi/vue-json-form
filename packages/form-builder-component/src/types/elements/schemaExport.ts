/**
 * schemaExport.ts
 *
 * Pure, side-effect-free functions for computing exported schemas from the
 * current element tree + JSON schema state.  Extracted from the Pinia store
 * so they can be unit-tested without any Vue/Pinia setup.
 *
 * These are the canonical implementation — the store computed properties
 * delegate to these.
 */

import type { JSONSchema } from '@educorvi/vue-json-form-schemas';
import type { FormElement, LayoutElement, WizardElement } from '../formTypes';
import { wrapElement } from './index';

/** Thin UISchema type matching what the store/VJF expects. */
export interface UISchemaExport {
    version: '2.1';
    layout: LayoutElement | WizardElement;
}

/**
 * Compute the fully-resolved JSON Schema for export.
 *
 * Works in two scenarios:
 *  a) Schema migration ran: the control's schema was moved from `rootProps`
 *     into the container's stored properties (Array.items.properties or
 *     Object.properties).  ControlNode finds it there via the initial copy
 *     inside ArrayNode/ObjectNode.collectSchemas.
 *  b) Schema migration did NOT run (e.g. a palette click followed by a drag
 *     before the SortableJS events fired): the schema is still in `rootProps`.
 *     ControlNode.collectSchemas reads from `rootProps` and places it in the
 *     correct target (the container's itemProps/nestedProps), so the output
 *     is still correct.
 *
 * @param rootLayout  The root LayoutElement or WizardElement from the editor state.
 * @param jsonSchema  The root JSONSchema from the editor state (properties = flat map).
 */
export function computeExportedJsonSchema(
    rootLayout: LayoutElement | WizardElement,
    jsonSchema: JSONSchema
): JSONSchema {
    const rootProps =
        (jsonSchema.properties as Record<string, JSONSchema>) ?? {};
    const exportedProps: Record<string, JSONSchema> = {};
    wrapElement(rootLayout as FormElement).collectSchemas(
        exportedProps,
        rootProps
    );
    return { ...jsonSchema, properties: exportedProps };
}

/**
 * Compute the VJF UI Schema for export / preview.
 * Pure — reads only from the element tree.
 */
export function computeUiSchema(
    rootLayout: LayoutElement | WizardElement
): UISchemaExport {
    return {
        version: '2.1',
        layout: wrapElement(rootLayout as FormElement).toUiSchema() as
            | LayoutElement
            | WizardElement,
    };
}
