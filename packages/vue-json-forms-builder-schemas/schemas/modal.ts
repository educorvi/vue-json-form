import { z } from 'zod';
import type { Modal, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { FormElement, FormElementOptionalKeys } from './form-element';
import type { SchemaGenerator } from './schema-generator';
import { PartialBy } from './base';
import { createShowOnProperty } from './children-schema-utils';
import { ButtonVariantFormatEnum, ButtonVariantFormat } from './utils';
import modalSchema from '@educorvi/vue-json-form-schemas/src/ui/modal.schema.json' with { type: 'json' };

type ModalSizeValue = NonNullable<Modal['modal']['size']>;
const ModalSizeEnum = z.enum(
    modalSchema.properties.modal.properties.size.enum as [
        ModalSizeValue,
        ...ModalSizeValue[],
    ]
);
export type ModalSize = z.infer<typeof ModalSizeEnum>;

type ModalElementData = z.infer<typeof ModalElement.schema>;
const modalElementDefaults = {
    type: 'modal' as const,
    size: 'large' as const,
    buttonVariant: 'primary' as const,
    asLink: false as const,
};
type ModalElementOptionalKeys =
    keyof typeof modalElementDefaults | FormElementOptionalKeys;

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

    toUiSchema(_generator: SchemaGenerator, scope: string[]): Modal {
        const uiSchema: Modal = {
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
        return {};
    }

    static fromJsonSchemaAndUiSchema(
        id: string,
        _jsonSchema: JSONSchema = {},
        uiSchema: Modal
    ): ModalElement {
        // TODO
        return new ModalElement({
            id: id,
            title: uiSchema.modal.title,
            content: uiSchema.modal.content,
            buttonLabel: uiSchema.button.text,
        });
    }
}
