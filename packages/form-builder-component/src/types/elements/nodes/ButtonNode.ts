import { v4 as uuidv4 } from 'uuid';
import type {
    Button as VJFButton,
    JSONSchema,
} from '@educorvi/vue-json-form-schemas';
import { EditorNode } from '../EditorNode';
import type { ButtonElement } from '../../formTypes';

export class ButtonNode extends EditorNode {
    static readonly icon = 'bi bi-send';
    static readonly isContainer = false;

    constructor(readonly element: ButtonElement) {
        super();
    }

    getLabel(_jsonSchema?: JSONSchema): string {
        return this.element.text ?? 'Button';
    }

    toUiSchema(): VJFButton {
        const { _id, ...rest } = this.element as any;
        return rest as VJFButton;
    }

    static fromUiSchema(raw: VJFButton): ButtonElement {
        return { ...raw, _id: uuidv4() } as ButtonElement;
    }
}
