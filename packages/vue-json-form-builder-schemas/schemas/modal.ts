import { z } from 'zod';
import type {
    JSONSchema,
    Modal as UiModal,
} from '@educorvi/vue-json-form-schemas';
import { FormElement, FormElementOptionalKeys } from './form-element';
import type { SchemaGenerator } from './schema-generator';
import { PartialBy } from './base';
import { createShowOnProperty } from './children-schema-utils';
import { ButtonVariantFormat, ButtonVariantFormatEnum } from './utils';

/**
 * Modal sizes. Values mirror the `modal` size enum of
 * modal.schema.json in @educorvi/vue-json-form-schemas.
 */
export enum ModalSize {
    Small = 'small',
    Medium = 'medium',
    Large = 'large',
    XLarge = 'x-large',
}

const ModalSizeEnum = z.enum(ModalSize);

type ModalElementData = z.infer<typeof ModalElement.schema>;
const modalElementDefaults = {
    type: 'modal' as const,
    size: ModalSize.Large,
    buttonVariant: 'primary' as const,
    asLink: false as const,
};
type ModalElementOptionalKeys =
    keyof typeof modalElementDefaults | FormElementOptionalKeys;

/** A button that opens a modal with informational content. */
export class ModalElement extends FormElement {
    data: ModalElementData;

    static schema = FormElement.schema.extend({
        type: z.literal('modal'),
        title: z.string(),
        content: z.string(),
        size: ModalSizeEnum,
        buttonLabel: z.string(),
        buttonVariant: ButtonVariantFormatEnum,
        asLink: z.boolean(),
    });

    constructor(
        data: Omit<
            PartialBy<ModalElementData, ModalElementOptionalKeys>,
            'type'
        >
    ) {
        super(data);
        this.data = ModalElement.setDefaults(data);
    }

    protected static setDefaults(
        data: PartialBy<ModalElementData, ModalElementOptionalKeys>
    ): ModalElementData {
        return {
            ...super.setDefaults(data),
            ...modalElementDefaults,
            ...data,
        };
    }

    get title(): string {
        return this.data.title;
    }

    get content(): string {
        return this.data.content;
    }

    get size(): ModalSize {
        return this.data.size;
    }

    get buttonLabel(): string {
        return this.data.buttonLabel;
    }

    get buttonVariant(): ButtonVariantFormat {
        return this.data.buttonVariant;
    }

    get asLink(): boolean {
        return this.data.asLink;
    }

    toUiSchema(_generator: SchemaGenerator, scope: string[]): UiModal {
        const uiSchema: UiModal = {
            type: 'Modal',
            modal: {
                title: this.title,
                content: this.content,
                size: this.size,
            },
            button: {
                text: this.buttonLabel,
                variant: this.buttonVariant,
                // asLink: this.asLink, TODO doesnt exist in the schema yet?
            },
        };

        const showOn = createShowOnProperty(
            this.dependencyGroup,
            _generator,
            scope
        );
        if (showOn) {
            uiSchema.showOn = showOn;
        }

        return uiSchema;
    }

    toJsonSchema(_generator: SchemaGenerator, _scope: string[]): JSONSchema {
        // modals have no data of their own
        return {};
    }

    static fromJsonSchemaAndUiSchema(
        id: string,
        _jsonSchema: JSONSchema = {},
        uiSchema: UiModal
    ): ModalElement {
        return new ModalElement({
            id: id,
            title: uiSchema.modal?.title ?? '',
            content: uiSchema.modal?.content ?? '',
            size:
                (uiSchema.modal?.size as ModalSize | undefined) ??
                ModalSize.Large,
            buttonLabel: uiSchema.button?.text ?? 'Open',
            buttonVariant:
                (uiSchema.button?.variant as ButtonVariantFormat | undefined) ??
                'primary',
        });
    }
}
