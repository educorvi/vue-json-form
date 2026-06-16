import { v4 as uuidv4 } from 'uuid';
import type { HTMLRenderer, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { EditorNode } from '../EditorNode';
import type { HTMLElement_ } from '../../formTypes';

export class HtmlNode extends EditorNode {
    static readonly icon = 'bi bi-code';
    static readonly isContainer = false;

    constructor(readonly element: HTMLElement_) {
        super();
    }

    getLabel(_jsonSchema?: JSONSchema): string {
        return 'HTML Block';
    }

    toUiSchema(): HTMLRenderer {
        const { _id, type, ...rest } = this.element as any;
        // VJF's HTMLRenderer has an optional `type`; strip our internal "HTML" string
        return rest as HTMLRenderer;
    }

    static fromUiSchema(raw: HTMLRenderer): HTMLElement_ {
        return { type: 'HTML', htmlData: raw.htmlData ?? '', _id: uuidv4() };
    }
}
