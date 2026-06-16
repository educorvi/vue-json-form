import { v4 as uuidv4 } from 'uuid';
import type {
    Layout,
    Wizard,
    JSONSchema,
    LayoutElement as VJFLayoutElement,
} from '@educorvi/vue-json-form-schemas';
import { EditorNode } from '../EditorNode';
import type { WizardElement, WizardPage, FormElement } from '../../formTypes';
import { wrapElement, nodeFromUiSchema } from '../index';

export class WizardNode extends EditorNode {
    static readonly icon = 'bi bi-book';
    static readonly isContainer = true;

    constructor(readonly element: WizardElement) {
        super();
    }

    getLabel(_jsonSchema?: JSONSchema): string {
        return 'Wizard';
    }

    override get children(): FormElement[] {
        return this.element.pages as unknown as FormElement[];
    }

    /**
     * Serialise to VJF Wizard. The return type is cast because Wizard is not a
     * VJFLayoutElement; the store/export layer re-casts it appropriately.
     */
    toUiSchema(): VJFLayoutElement {
        const wizard: Wizard = {
            type: 'Wizard',
            pages: this.element.pages.map((page) => {
                const { _id: _pageId, ...pageRest } = page as any;
                return {
                    ...pageRest,
                    elements: page.elements.map((child) =>
                        wrapElement(child).toUiSchema()
                    ),
                } as Layout;
            }),
            ...(this.element.options ? { options: this.element.options } : {}),
        };
        return wizard as unknown as VJFLayoutElement;
    }

    override collectSchemas(
        target: Record<string, JSONSchema>,
        rootProps?: Record<string, JSONSchema>
    ): void {
        for (const page of this.element.pages) {
            for (const el of page.elements) {
                wrapElement(el).collectSchemas(target, rootProps);
            }
        }
    }

    static fromUiSchema(raw: Wizard, jsonSchema?: JSONSchema): WizardElement {
        return {
            type: 'Wizard',
            pages: (raw.pages ?? []).map(
                (page) =>
                    ({
                        type: page.type ?? 'VerticalLayout',
                        elements: (page.elements ?? []).map((el) =>
                            nodeFromUiSchema(el, jsonSchema)
                        ),
                        ...(page.options ? { options: page.options } : {}),
                        _id: uuidv4(),
                    }) as WizardPage
            ),
            ...(raw.options ? { options: raw.options } : {}),
            _id: uuidv4(),
        };
    }
}
