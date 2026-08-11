import { z } from "zod";
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { FormElement, FormElementOptionalKeys } from "./form-element";
import type { SchemaGenerator } from "./schema-generator";
import { PartialBy } from "./base";
import { createShowOnProperty } from "./children-schema-utils";
import { ButtonVariant } from "./../utils";

enum ButtonSubmitAction {
    Request = "request",
    Save = "save",
    Print = "print",
}

enum HttpsMethod {
    Get = "GET",
    Post = "POST",
    Put = "PUT",
    Delete = "DELETE",
    // Patch = "PATCH"
}


type ButtonGroupData = z.infer<typeof ButtonGroup.schema>;
const buttonGroupDefaults = {type: "button-group" as const, buttons: [] as string[]};
type ButtonGroupOptionalKeys = keyof typeof buttonGroupDefaults | FormElementOptionalKeys;

export class ButtonGroup extends FormElement {
    data: ButtonGroupData;

    static schema = FormElement.schema.extend({
        type: z.literal("button-group"),
        buttons: z.array(z.string())
    });

    constructor(
        data: Omit<PartialBy<ButtonGroupData, ButtonGroupOptionalKeys>, "type">
    ) {
        super(data);
        this.data = ButtonGroup.setDefaults(data);
    }

    protected static setDefaults(data: PartialBy<ButtonGroupData, ButtonGroupOptionalKeys>): ButtonGroupData {
        return {
            ...super.setDefaults(data),
            ...buttonGroupDefaults,
            ...data,
        };
    }

    get buttons(): string[] {
        return this.data.buttons;
    }

    toUiSchema(_generator: SchemaGenerator, scope: string[]): Control {
        // TODO
    }

    toJsonSchema(_generator: SchemaGenerator, scope: string[]): JSONSchema {
        // TODO
    }

    static fromJsonSchemaAndUiSchema(id: string, jsonSchema: JSONSchema={}, uiSchema: Control): ButtonGroup {
        // TODO
    }

}


type ButtonData = z.infer<typeof Button.schema>;
const buttonDefaults = {disabled: false, variant: ButtonVariant.Primary};
type ButtonOptionalKeys = keyof typeof buttonDefaults | FormElementOptionalKeys;

export abstract class Button extends FormElement {
    data: ButtonData;

    static schema = FormElement.schema.extend({
        label: z.string(),
        disabled: z.boolean(),
        variant: z.enum(ButtonVariant)
    });

    constructor(
        data: PartialBy<ButtonData, ButtonOptionalKeys>
    ) {
        super(data);
        this.data = Button.setDefaults(data);
    }

    protected static setDefaults(data: PartialBy<ButtonData, ButtonOptionalKeys>): ButtonData {
        return {
            ...super.setDefaults(data),
            ...buttonDefaults,
            ...data,
        };
    }

    get label(): string {
        return this.data.label;
    }

    get disabled(): boolean {
        return this.data.disabled;
    }

    get variant(): ButtonVariant {
        return this.data.variant;
    }

    toUiSchema(_generator: SchemaGenerator, scope: string[]): Control {
        // TODO what do all buttons have in common?
    }

    toJsonSchema(_generator: SchemaGenerator, scope: string[]): JSONSchema {
        // TODO what do all buttons have in common?
    }

    static fromJsonSchemaAndUiSchema(id: string, jsonSchema: JSONSchema={}, uiSchema: Control): Button {
        // TODO what do all buttons have in common?
    }
}


type ResetButtonData = z.infer<typeof ResetButton.schema>;
const resetButtonDefaults = {type: "reset-button" as const};
type ResetButtonOptionalKeys = keyof typeof resetButtonDefaults | ButtonOptionalKeys;

export class ResetButton extends Button {
    data: ResetButtonData;

    static schema = Button.schema.extend({
        type: z.literal("reset-button")
    });

    constructor(
        data: Omit<PartialBy<ResetButtonData, ResetButtonOptionalKeys>, "type">
    ) {
        super(data);
        this.data = ResetButton.setDefaults(data);
    }

    protected static setDefaults(data: PartialBy<ResetButtonData, ResetButtonOptionalKeys>): ResetButtonData {
        return {
            ...super.setDefaults(data),
            ...resetButtonDefaults,
            ...data,
        };
    }

    toUiSchema(_generator: SchemaGenerator, scope: string[]): Control {
        // TODO
    }

    toJsonSchema(_generator: SchemaGenerator, scope: string[]): JSONSchema {
        // TODO
    }

    static fromJsonSchemaAndUiSchema(id: string, jsonSchema: JSONSchema={}, uiSchema: Control): ResetButton {
        // TODO
    }

}


type SubmitButtonData = z.infer<typeof SubmitButton.schema>;
const submitButtonDefaults = {type: "submit-button" as const, submitAction: ButtonSubmitAction.Request, submitUrl: "", submitMethod: HttpsMethod.Post};
type SubmitButtonOptionalKeys = keyof typeof submitButtonDefaults | ButtonOptionalKeys;

export class SubmitButton extends Button {
    data: SubmitButtonData;

    static schema = Button.schema.extend({
        type: z.literal("submit-button"),
        submitAction: z.enum(ButtonSubmitAction),
        submitUrl: z.url(),
        submitMethod: z.enum(HttpsMethod),
        requestHeaders: z.string().optional(), // JSON string of key-value pairs
        onSuccessRedirectUrl: z.url().optional(),
        // TODO summary from ui schema definition?
    });

    constructor(
        data: Omit<PartialBy<SubmitButtonData, SubmitButtonOptionalKeys>, "type">
    ) {
        super(data);
        this.data = SubmitButton.setDefaults(data);
    }

    protected static setDefaults(data: PartialBy<SubmitButtonData, SubmitButtonOptionalKeys>): SubmitButtonData {
        return {
            ...super.setDefaults(data),
            ...submitButtonDefaults,
            ...data,
        };
    }

    get submitAction(): ButtonSubmitAction {
        return this.data.submitAction;
    }

    get submitUrl(): string {
        return this.data.submitUrl;
    }

    get submitMethod(): HttpsMethod {
        return this.data.submitMethod;
    }

    get requestHeaders(): string | undefined {
        return this.data.requestHeaders;
    }

    get onSuccessRedirectUrl(): string | undefined {
        return this.data.onSuccessRedirectUrl;
    }

    toUiSchema(_generator: SchemaGenerator, scope: string[]): Control {
        // TODO
    }

    toJsonSchema(_generator: SchemaGenerator, scope: string[]): JSONSchema {
        // TODO
    }

    static fromJsonSchemaAndUiSchema(id: string, jsonSchema: JSONSchema={}, uiSchema: Control): SubmitButton {
        // TODO
    }
}