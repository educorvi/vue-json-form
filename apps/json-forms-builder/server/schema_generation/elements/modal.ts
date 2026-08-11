import { z } from "zod";
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { FormElement, FormElementOptionalKeys } from "./form-element";
import type { SchemaGenerator } from "./schema-generator";
import { PartialBy } from "./base";
import { createShowOnProperty } from "./children-schema-utils";
import { ButtonVariant } from "./../utils";


enum ModalSize {
    Small = "small",
    Medium = "medium",
    Large = "large",
    XLarge = "x-large"
}


type ModalElementData = z.infer<typeof ModalElement.schema>;
const modalElementDefaults = {type: "modal" as const, size: ModalSize.Medium, variant: ButtonVariant.Primary};
type ModalElementOptionalKeys = keyof typeof modalElementDefaults | FormElementOptionalKeys;

export class ModalElement extends FormElement {
    data: ModalElementData;

    static schema = FormElement.schema.extend({
        type: z.literal("modal"),
        title: z.string(),
        content: z.string(),
        size: z.enum(ModalSize),
        buttonLabel: z.string(),
        variant: z.enum(ButtonVariant),
    });

    constructor(
        data: Omit<PartialBy<ModalElementData, ModalElementOptionalKeys>, "type">
    ) {
        super(data);
        this.data = ModalElement.setDefaults(data);
    }

    protected static setDefaults(data: PartialBy<ModalElementData, ModalElementOptionalKeys>): ModalElementData {
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

    get variant(): ButtonVariant {
        return this.data.variant;
    }

    toUiSchema(_generator: SchemaGenerator, scope: string[]): Control {
        // TODO
    }

    toJsonSchema(_generator: SchemaGenerator, scope: string[]): JSONSchema {
        // TODO
    }

    static fromJsonSchemaAndUiSchema(id: string, jsonSchema: JSONSchema={}, uiSchema: Control): ModalElement {
        // TODO
    }

}