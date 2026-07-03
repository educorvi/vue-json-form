import { v4 as uuidv4 } from 'uuid';
import type { Layout, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { EditorNode, type DropZoneConfig } from '../EditorNode';
import type { ObjectElement, FormElement } from '../../formTypes';
import { wrapElement } from '../index.ts';

export class ObjectNode extends EditorNode {
    static readonly icon = 'bi bi-sitemap';
    static readonly isContainer = true;

    constructor(readonly element: ObjectElement) {
        super();
    }

    getLabel(_jsonSchema?: JSONSchema): string {
        return (
            (this.element.title as string | undefined) ??
            `Object: ${this.element.key}`
        );
    }

    override get dropZone(): DropZoneConfig {
        return {
            allowedTypes: ['Control', 'Object', 'Array'],
            layout: 'vertical',
            emptyLabel: 'Drop fields here',
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
        const nestedProps: Record<string, JSONSchema> = {
            ...((this.element.properties as Record<string, JSONSchema>) ?? {}),
        };
        for (const child of this.element.elements) {
            wrapElement(child).collectSchemas(nestedProps, rootProps);
        }
        const required = (this.element.required as string[] | undefined) ?? [];
        target[this.element.key] = {
            type: 'object',
            title:
                (this.element.title as string | undefined) ?? this.element.key,
            properties: nestedProps,
            ...(required.length ? { required } : {}),
        };
    }

    override schemaContext(): {
        props: Record<string, JSONSchema>;
        required: string[];
    } {
        return {
            props:
                (this.element.properties as Record<string, JSONSchema>) ?? {},
            required: (this.element.required as string[]) ?? [],
        };
    }

    toUiSchema(scopePrefix = ''): Layout {
        const objPrefix = `${scopePrefix}/properties/${this.element.key}`;
        return {
            type: 'Group',
            options: {
                label:
                    (this.element.title as string | undefined) ??
                    this.element.key,
                ...(this.element.description
                    ? { description: this.element.description as string }
                    : {}),
                ...(this.element.options?.cssClass
                    ? { cssClass: this.element.options.cssClass }
                    : {}),
            },
            elements: this.element.elements.map((child) =>
                wrapElement(child).toUiSchema(objPrefix)
            ),
            ...(this.element.showOn ? { showOn: this.element.showOn } : {}),
        } as Layout;
    }
}
