import type {
    JSONSchema,
    UISchema,
    Control,
    Layout as UiLayout,
} from '@educorvi/vue-json-form-schemas';
import { ArrayElement, ObjectElement } from './container';
import { FormElement } from './form-element';
import { Form } from './form';
import { FormDefinition } from './form-definition';
import { StringElement } from './string';
import { ColorElement } from './color';
import { TimeElement } from './time';
import { NumberElement } from './number';
import { BooleanElement } from './boolean';
import { EnumElement, CheckboxGroupElement } from './selection';
import { FileuploadElement } from './file-upload';
import { Layout, createId } from './utils';

/**
 * Reconstruct a FormDefinition from its serialized plain-JSON representation
 * (the format produced by FormDefinition.toJSON()).
 *
 * Throws if the data is invalid (validated against the zod schemas).
 */
export function fromJSON(data: string | object): FormDefinition {
    const json = typeof data === 'string' ? data : JSON.stringify(data);
    return FormDefinition.fromJSON(json);
}

/**
 * Build a FormDefinition from an exported {json, ui} schema pair (the format
 * that is currently persisted in the backend, e.g. form.schema in the DB).
 *
 * The element tree is derived from the JSON Schema; UI-only information
 * (placeholder, tooltip, hidden, ...) is picked up from the matching Control
 * in the UI schema, matched by the last scope segment (= the property key /
 * element id).
 *
 * TODO:
 *  - restore layout nesting from ui schema (currently flattened)
 *  - restore wizard pages
 *  - restore dependency groups (showOn)
 */
export function fromJsonSchemaAndUiSchema(
    jsonSchema: JSONSchema,
    uiSchema: UISchema
): FormDefinition {
    const rootUi = uiSchema.layout as UiLayout;
    const uiControls = collectUiControls(rootUi);

    const elements: FormElement[] = [];
    const root = new Form({
        id: createId(jsonSchema.title ? String(jsonSchema.title) : 'form'),
        title: jsonSchema.title ? String(jsonSchema.title) : 'My Form',
        layout: layoutFromUiType(rootUi.type),
        children: [],
    });

    const properties = (jsonSchema.properties ?? {}) as Record<
        string,
        JSONSchema
    >;
    const required = (jsonSchema.required ?? []) as string[];
    for (const [key, childSchema] of Object.entries(properties)) {
        const child = buildElementTree(
            key,
            childSchema,
            required.includes(key),
            uiControls,
            elements
        );
        if (child) {
            root.children.push(child.uid);
        }
    }

    return new FormDefinition(root, elements);
}

// ─── Internals ───────────────────────────────────────────────────────────────

/** Collects all Controls of a UI schema, keyed by scope key. */
function collectUiControls(uiLayout: UiLayout): Map<string, Control> {
    const map = new Map<string, Control>();
    const walk = (elements: UiLayout['elements']): void => {
        for (const el of elements ?? []) {
            if (el.type === 'Control') {
                map.set(scopeKey(el.scope), el);
            } else if (
                'elements' in el &&
                Array.isArray((el as any).elements)
            ) {
                walk((el as any).elements);
            }
        }
    };
    walk(uiLayout.elements ?? []);
    return map;
}

/** Last segment of a scope path, e.g. "/properties/foo" → "foo". */
function scopeKey(scope: string | undefined): string {
    if (!scope) return '';
    const segments = scope.split('/').filter(Boolean);
    return segments[segments.length - 1] ?? '';
}

function layoutFromUiType(type: string | undefined): Layout {
    if (type === Layout.Horizontal) return Layout.Horizontal;
    if (type === Layout.Group) return Layout.Group;
    return Layout.Vertical;
}

/**
 * Recursively builds an element subtree from a JSON Schema fragment.
 * The property key is the element's id (the schema property name).
 */
function buildElementTree(
    key: string,
    jsonSchema: JSONSchema,
    required: boolean,
    uiControls: Map<string, Control>,
    elements: FormElement[] = []
): FormElement | null {
    const type =
        typeof jsonSchema.type === 'string' ? jsonSchema.type : 'object';
    const ui = uiControls.get(key) ?? { type: 'Control', scope: '' };

    if (type === 'string') {
        const format =
            typeof jsonSchema.format === 'string'
                ? jsonSchema.format
                : undefined;

        // color / time / date inputs have their own element classes
        if (format === 'color') {
            const el = ColorElement.fromJsonSchemaAndUiSchema(
                key,
                jsonSchema,
                ui
            );
            elements.push(el);
            return el;
        }
        if (format === 'time' || format === 'date' || format === 'date-time') {
            const el = TimeElement.fromJsonSchemaAndUiSchema(
                key,
                jsonSchema,
                ui,
                required
            );
            elements.push(el);
            return el;
        }
        // legacy file-upload imports serialize as a uri string
        if (format === 'uri') {
            const el = FileuploadElement.fromJsonSchemaAndUiSchema(
                key,
                jsonSchema,
                ui,
                required
            );
            elements.push(el);
            return el;
        }
        // a string with an enum is a selection
        if (jsonSchema.enum) {
            const el = EnumElement.fromJsonSchemaAndUiSchema(
                key,
                jsonSchema,
                ui,
                required
            );
            elements.push(el);
            return el;
        }

        const el = StringElement.fromJsonSchemaAndUiSchema(
            key,
            jsonSchema,
            ui,
            required
        );
        elements.push(el);
        return el;
    }

    if (type === 'boolean') {
        const el = BooleanElement.fromJsonSchemaAndUiSchema(
            key,
            jsonSchema,
            ui,
            required
        );
        elements.push(el);
        return el;
    }

    if (type === 'number' || type === 'integer') {
        const el = NumberElement.fromJsonSchemaAndUiSchema(
            key,
            jsonSchema,
            ui,
            required
        );
        elements.push(el);
        return el;
    }

    if (type === 'object') {
        const el = ObjectElement.fromJsonSchemaAndUiSchema(key, jsonSchema, ui);
        elements.push(el);
        const props = (jsonSchema.properties ?? {}) as Record<
            string,
            JSONSchema
        >;
        const req = (jsonSchema.required ?? []) as string[];
        for (const [childKey, childSchema] of Object.entries(props)) {
            const child = buildElementTree(
                childKey,
                childSchema,
                req.includes(childKey),
                uiControls,
                elements
            );
            if (child) el.data.children.push(child.uid);
        }
        return el;
    }

    if (type === 'array') {
        const items = jsonSchema.items as JSONSchema | undefined;
        const itemsType =
            items && typeof items === 'object' ? items.type : undefined;
        const itemsFormat =
            items && typeof items === 'object' ? items.format : undefined;

        // an array of enums is a checkbox group
        if (items && itemsType === 'string' && items.enum) {
            const el = CheckboxGroupElement.fromJsonSchemaAndUiSchema(
                key,
                jsonSchema,
                ui,
                required
            );
            elements.push(el);
            return el;
        }
        // legacy multi-upload file imports serialize as an array of uri strings
        if (items && itemsType === 'string' && itemsFormat === 'uri') {
            const el = FileuploadElement.fromJsonSchemaAndUiSchema(
                key,
                jsonSchema,
                ui,
                required
            );
            elements.push(el);
            return el;
        }

        const el = ArrayElement.fromJsonSchemaAndUiSchema(
            key,
            jsonSchema,
            ui,
            required
        );
        elements.push(el);
        if (items && typeof items === 'object') {
            // array items have no property key of their own — derive a stable id
            const child = buildElementTree(
                createId(`${key}_item`),
                items,
                false,
                uiControls,
                elements
            );
            if (child) el.data.children.push(child.uid);
        }
        return el;
    }

    // unsupported type — skip the property but do not fail the import
    return null;
}
