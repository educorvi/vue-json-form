import { v4 as uuidv4 } from 'uuid';
import type { Layout, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { EditorNode, type DropZoneConfig } from '../EditorNode';
import type { LayoutElement, FormElement } from '../../formTypes';
import { wrapElement, nodeFromUiSchema } from '../index.ts';

export class LayoutNode extends EditorNode {
    static readonly isContainer = true;

    constructor(readonly element: LayoutElement) {
        super();
    }

    get icon(): string {
        switch (this.element.type) {
            case 'HorizontalLayout':
                return 'bi bi-table';
            case 'Group':
                return 'bi bi-folder';
            default:
                return 'bi bi-list';
        }
    }

    getLabel(_jsonSchema?: JSONSchema): string {
        switch (this.element.type) {
            case 'VerticalLayout':
                return 'Vertical Layout';
            case 'HorizontalLayout':
                return 'Horizontal Layout';
            case 'Group':
                return this.element.options?.label ?? 'Group';
            default:
                return this.element.type;
        }
    }

    override get dropZone(): DropZoneConfig {
        return {
            allowedTypes: '*',
            layout:
                this.element.type === 'HorizontalLayout'
                    ? 'horizontal'
                    : 'vertical',
            emptyLabel: 'Drop elements here',
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
        for (const child of this.element.elements) {
            wrapElement(child).collectSchemas(target, rootProps);
        }
    }

    toUiSchema(scopePrefix = ''): Layout {
        const { _id, ...rest } = this.element as any;
        return {
            ...rest,
            elements: this.element.elements.map((child) =>
                wrapElement(child).toUiSchema(scopePrefix)
            ),
        } as Layout;
    }

    static fromUiSchema(raw: Layout, jsonSchema?: JSONSchema): LayoutElement {
        return {
            type: raw.type,
            elements: (raw.elements ?? []).map((el) =>
                nodeFromUiSchema(el, jsonSchema)
            ),
            ...(raw.showOn ? { showOn: raw.showOn } : {}),
            ...(raw.options ? { options: raw.options } : {}),
            _id: uuidv4(),
        } as LayoutElement;
    }
}
