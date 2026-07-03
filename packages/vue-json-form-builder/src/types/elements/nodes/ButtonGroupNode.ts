import { v4 as uuidv4 } from 'uuid';
import type {
    Buttongroup,
    Button as VJFButton,
    JSONSchema,
} from '@educorvi/vue-json-form-schemas';
import { EditorNode, type DropZoneConfig } from '../EditorNode';
import type { ButtonGroupElement, FormElement } from '../../formTypes';
import { ButtonNode } from './ButtonNode';

export class ButtonGroupNode extends EditorNode {
    static readonly icon = 'bi bi-segmented-nav';
    /**
     * false: buttons are not shown as children in the tree view.
     * The ButtonGroup renders as a leaf row with inline buttons on the canvas.
     * It still has a dropZone so users can drop Button elements into it.
     */
    static readonly isContainer = false;

    constructor(readonly element: ButtonGroupElement) {
        super();
    }

    getLabel(_jsonSchema?: JSONSchema): string {
        return 'Button Group';
    }

    override get dropZone(): DropZoneConfig {
        return {
            allowedTypes: ['Button'],
            layout: 'flex-row',
            emptyLabel: 'Drop Button elements here',
        };
    }

    override get children(): FormElement[] {
        return this.element.buttons as unknown as FormElement[];
    }

    override set children(val: FormElement[] | null) {
        (this.element.buttons as any) = val ?? [];
    }

    toUiSchema(): Buttongroup {
        return {
            type: 'Buttongroup',
            buttons: this.element.buttons.map(
                (btn) => new ButtonNode(btn).toUiSchema() as VJFButton
            ),
            ...(this.element.showOn ? { showOn: this.element.showOn } : {}),
        } as unknown as Buttongroup;
    }

    static fromUiSchema(raw: Buttongroup): ButtonGroupElement {
        return {
            type: 'ButtonGroup',
            buttons: (raw.buttons ?? []).map((btn) =>
                ButtonNode.fromUiSchema(btn as VJFButton)
            ),
            ...(raw.showOn ? { showOn: raw.showOn } : {}),
            _id: uuidv4(),
        } as ButtonGroupElement;
    }
}
