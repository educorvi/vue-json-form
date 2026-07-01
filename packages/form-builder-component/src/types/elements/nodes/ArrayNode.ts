import { v4 as uuidv4 } from 'uuid';
import type {
    Control,
    JSONSchema,
    DescendantControlOverrides,
    DescendantControlOverride,
    Options,
    ShowOnProperty,
} from '@educorvi/vue-json-form-schemas';
import { EditorNode, type DropZoneConfig } from '../EditorNode';
import type {
    ArrayElement,
    ControlElement,
    ObjectElement,
    FormElement,
} from '../../formTypes';
import { wrapElement } from '../index';
import { controlKey } from '../schemaResolver';

export class ArrayNode extends EditorNode {
    static readonly icon = 'bi bi-list';
    static readonly isContainer = true;

    constructor(readonly element: ArrayElement) {
        super();
    }

    getLabel(_jsonSchema?: JSONSchema): string {
        return (
            (this.element.title as string | undefined) ??
            `Array: ${this.element.key}`
        );
    }

    override get dropZone(): DropZoneConfig {
        return {
            allowedTypes: ['Control', 'Object', 'Array'],
            layout: 'vertical',
            emptyLabel: 'Drop one field here (item schema)',
            maxChildren: 1,
        };
    }

    override get children(): FormElement[] {
        return this.element.elements;
    }

    override set children(val: FormElement[] | null) {
        this.element.elements = val ?? [];
    }

    override collectSchemas(
        target: Record<string, JSONSchema>,
        rootProps?: Record<string, JSONSchema>
    ): void {
        const itemsSchema = this.element.items as JSONSchema | undefined;

        const baseSchema: JSONSchema = {
            type: 'array',
            title:
                (this.element.title as string | undefined) ?? this.element.key,
            ...(this.element.minItems !== undefined
                ? { minItems: this.element.minItems as number }
                : {}),
            ...(this.element.maxItems !== undefined
                ? { maxItems: this.element.maxItems as number }
                : {}),
        } as JSONSchema;

        const elements = this.element.elements;

        if (elements.length === 0) {
            // Empty array — pass through stored items schema only when it has
            // meaningful content. An { type:"object", properties:{} } leftover
            // from a migration that moved the last field out should be skipped.
            const emptyObjectWrapper =
                itemsSchema &&
                itemsSchema.type === 'object' &&
                Object.keys((itemsSchema.properties as object) ?? {}).length ===
                    0 &&
                !(itemsSchema as any).required?.length;
            target[this.element.key] = {
                ...baseSchema,
                ...(!emptyObjectWrapper && itemsSchema
                    ? { items: itemsSchema }
                    : {}),
            };
            return;
        }

        const child = elements[0]; // maxChildren: 1

        if (child.type === 'Control') {
            // Single primitive control → items IS the control's schema directly,
            // not wrapped in { type:"object", properties:{ key: schema } }
            const key = controlKey((child as ControlElement).scope);
            // Schema may have been migrated to items.properties OR still in rootProps
            const migratedProps =
                (itemsSchema?.properties as Record<string, JSONSchema>) ?? {};
            const schema = migratedProps[key] ?? rootProps?.[key];
            target[this.element.key] = {
                ...baseSchema,
                ...(schema ? { items: schema } : {}),
            };
        } else if (child.type === 'Object') {
            // Object child → items IS the object schema itself (no double-wrap)
            const objEl = child as unknown as ObjectElement;
            const nestedProps: Record<string, JSONSchema> = {
                // Pre-populate from stored properties (handles migrated Control schemas)
                ...((objEl.properties as Record<string, JSONSchema>) ?? {}),
            };
            for (const grandchild of objEl.elements) {
                wrapElement(grandchild).collectSchemas(nestedProps, rootProps);
            }
            const required = (objEl.required as string[] | undefined) ?? [];
            target[this.element.key] = {
                ...baseSchema,
                items: {
                    type: 'object',
                    ...(objEl.title ? { title: objEl.title as string } : {}),
                    properties: nestedProps,
                    ...(required.length ? { required } : {}),
                } as JSONSchema,
            };
        } else if (child.type === 'Array') {
            // Nested array → collect its schema and use as items
            const innerTarget: Record<string, JSONSchema> = {};
            wrapElement(child).collectSchemas(innerTarget, rootProps);
            const arrEl = child as unknown as ArrayElement;
            const innerSchema = innerTarget[arrEl.key];
            target[this.element.key] = {
                ...baseSchema,
                ...(innerSchema ? { items: innerSchema } : {}),
            };
        } else {
            // Layout or other container — collect controls from it into itemProps
            // (legacy fallback: multiple controls via layout inside array)
            const itemProps: Record<string, JSONSchema> = {
                ...((itemsSchema?.properties as Record<string, JSONSchema>) ??
                    {}),
            };
            wrapElement(child).collectSchemas(itemProps, rootProps);
            const hasItemProps = Object.keys(itemProps).length > 0;
            const itemRequired =
                (itemsSchema?.required as string[] | undefined) ?? [];
            target[this.element.key] = {
                ...baseSchema,
                ...(hasItemProps
                    ? {
                          items: {
                              type: 'object',
                              properties: itemProps,
                              ...(itemRequired.length
                                  ? { required: itemRequired }
                                  : {}),
                          },
                      }
                    : itemsSchema
                      ? { items: itemsSchema }
                      : {}),
            };
        }
    }

    override schemaContext(): {
        props: Record<string, JSONSchema>;
        required: string[];
    } {
        const items = this.element.items as JSONSchema | undefined;
        return {
            props: (items?.properties as Record<string, JSONSchema>) ?? {},
            required: (items?.required as string[]) ?? [],
        };
    }

    toUiSchema(scopePrefix = ''): Control {
        // Build descendantControlOverrides from child control elements
        const overrides: DescendantControlOverrides = {};
        for (const child of this.element.elements) {
            if (child.type === 'Control') {
                const ctrl = child as ControlElement;
                const entry: DescendantControlOverride = {};
                if (ctrl.options) entry.options = ctrl.options as Options;
                if (ctrl.showOn) entry.showOn = ctrl.showOn as ShowOnProperty;
                if (entry.options || entry.showOn) {
                    overrides[ctrl.scope] = entry;
                }
            }
            // Nested Object/Array children contribute only to JSON schema (via collectSchemas)
        }

        const hasOverrides = Object.keys(overrides).length > 0;
        const baseOptions = this.element.options ?? {};
        const options =
            hasOverrides || Object.keys(baseOptions).length > 0
                ? {
                      ...baseOptions,
                      ...(hasOverrides
                          ? { descendantControlOverrides: overrides }
                          : {}),
                  }
                : undefined;

        return {
            type: 'Control',
            scope: `${scopePrefix}/properties/${this.element.key}`,
            ...(this.element.showOn ? { showOn: this.element.showOn } : {}),
            ...(options ? { options } : {}),
        } as Control;
    }

    /**
     * Reconstruct an ArrayElement from a UI-schema Control + its JSON Schema.
     * `descendantControlOverrides` are expanded back into child ControlElements.
     */
    static fromUiSchema(raw: Control, arraySchema: JSONSchema): ArrayElement {
        const key = controlKey(raw.scope);
        const items = (arraySchema.items ?? {
            type: 'object',
            properties: {},
        }) as JSONSchema;
        const itemProps =
            (items.properties as Record<string, JSONSchema>) ?? {};

        // Build child elements from item properties
        const elements: FormElement[] = [];
        const overrides = (raw.options as any)?.descendantControlOverrides as
            | DescendantControlOverrides
            | undefined;

        for (const propKey of Object.keys(itemProps)) {
            const scope = `/properties/${propKey}`;
            const override = overrides?.[scope];
            elements.push({
                type: 'Control',
                scope,
                ...(override?.options ? { options: override.options } : {}),
                ...(override?.showOn ? { showOn: override.showOn } : {}),
                _id: uuidv4(),
            } as ControlElement);
        }

        // Strip descendantControlOverrides from the element's own options
        const { descendantControlOverrides: _, ...cleanOptions } =
            (raw.options as any) ?? {};

        return {
            type: 'Array',
            key,
            elements,
            items,
            title: (arraySchema.title as string | undefined) ?? key,
            ...(arraySchema.minItems !== undefined
                ? { minItems: arraySchema.minItems }
                : {}),
            ...(arraySchema.maxItems !== undefined
                ? { maxItems: arraySchema.maxItems }
                : {}),
            ...(raw.showOn ? { showOn: raw.showOn } : {}),
            ...(Object.keys(cleanOptions).length
                ? { options: cleanOptions }
                : {}),
            _id: uuidv4(),
        } as ArrayElement;
    }
}
