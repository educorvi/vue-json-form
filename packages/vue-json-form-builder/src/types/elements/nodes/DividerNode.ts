import { v4 as uuidv4 } from 'uuid';
import type { Divider, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { EditorNode } from '../EditorNode';
import type { DividerElement } from '../../formTypes';

export class DividerNode extends EditorNode {
    static readonly icon = 'bi bi-minus';
    static readonly isContainer = false;

    constructor(readonly element: DividerElement) {
        super();
    }

    getLabel(_jsonSchema?: JSONSchema): string {
        return 'Divider';
    }

    toUiSchema(): Divider {
        const { _id, ...rest } = this.element as any;
        return rest as Divider;
    }

    static fromUiSchema(raw: Divider): DividerElement {
        return { ...raw, _id: uuidv4() } as DividerElement;
    }
}
