import { z } from 'zod';
import type {
    JSONSchema,
    Button as UiButton,
    Buttongroup as UiButtongroup,
    SubmitOptions,
    SubmitRequestOptions,
} from '@educorvi/vue-json-form-schemas';
import { FormElement, FormElementOptionalKeys } from './form-element';
import type { SchemaGenerator } from './schema-generator';
import { PartialBy } from './base';
import { createShowOnProperty } from './children-schema-utils';
import {
    ButtonVariantFormat,
    ButtonVariantFormatEnum,
    CombinedUiSchemaType,
} from './utils';

export enum ButtonSubmitAction {
    Request = 'request',
    Save = 'save',
    Print = 'print',
}

/**
 * HTTP methods for the submit request. Values mirror the `method` enum of
 * button.schema.json in @educorvi/vue-json-form-schemas.
 */
export enum HttpsMethod {
    Get = 'GET',
    Post = 'POST',
    Put = 'PUT',
    Delete = 'DELETE',
}

const HttpsMethodEnum = z.enum(HttpsMethod);

/** Any UI schema fragment that may be passed to fromJsonSchemaAndUiSchema. */
type AnyUiSchema = CombinedUiSchemaType;

function isUiButton(ui: AnyUiSchema): ui is UiButton {
    return 'type' in ui && ui.type === 'Button';
}

type ButtonGroupElementData = z.infer<typeof ButtonGroupElement.schema>;
const buttonGroupElementDefaults = {
    type: 'button-group' as const,
    buttons: [] as string[],
    vertical: false,
};
type ButtonGroupElementOptionalKeys =
    keyof typeof buttonGroupElementDefaults | FormElementOptionalKeys;

/**
 * A group of action buttons. `buttons` holds the uids of the Button
 * elements (ResetButton / SubmitButton) in the flat elements set.
 */
export class ButtonGroupElement extends FormElement {
    data: ButtonGroupElementData;

    static schema = FormElement.schema.extend({
        type: z.literal('button-group'),
        buttons: z.array(z.string()),
        vertical: z.boolean().default(false),
    });

    constructor(
        data: Omit<
            PartialBy<ButtonGroupElementData, ButtonGroupElementOptionalKeys>,
            'type'
        >
    ) {
        super(data);
        this.data = ButtonGroupElement.setDefaults(data);
    }

    protected static setDefaults(
        data: PartialBy<ButtonGroupElementData, ButtonGroupElementOptionalKeys>
    ): ButtonGroupElementData {
        return {
            ...super.setDefaults(data),
            ...buttonGroupElementDefaults,
            // buttons must never be a shared array
            buttons: data.buttons ? [...data.buttons] : [],
            ...data,
        };
    }

    get buttons(): string[] {
        return this.data.buttons;
    }

    get vertical(): boolean {
        return this.data.vertical;
    }

    toUiSchema(
        _generator: SchemaGenerator,
        scope: string[] = []
    ): UiButtongroup {
        const buttons = this.buttons.map((buttonId) => {
            const buttonElement = _generator.document.getElementById(buttonId);
            if (!buttonElement) {
                throw new Error(`Button with id ${buttonId} not found`);
            } else if (!(buttonElement instanceof ButtonElement)) {
                throw new Error(
                    `Element with id ${buttonId} is not a ButtonElement`
                );
            }
            return buttonElement.toUiSchema(_generator);
        });

        if (buttons.length === 0) {
            throw new Error(
                `ButtonGroupElement with id ${this.id} has no buttons`
            );
        }

        const uiSchema: UiButtongroup = {
            type: 'Buttongroup',
            options: { vertical: this.vertical },
            buttons: buttons as [UiButton, ...UiButton[]], // TODO better handling?
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
        // buttons have no data of their own
        return {};
    }

    static fromJsonSchemaAndUiSchema(
        id: string,
        _jsonSchema: JSONSchema = {},
        _uiSchema: AnyUiSchema
    ): ButtonGroupElement {
        return new ButtonGroupElement({ id: id });
    }
}

type ButtonElementData = z.infer<typeof ButtonElement.schema>;
const buttonElementDefaults = {
    disabled: false,
    variant: 'primary' as const,
};
type ButtonElementOptionalKeys =
    keyof typeof buttonElementDefaults | FormElementOptionalKeys;

/** Base class for action buttons (submit / reset). */
export abstract class ButtonElement extends FormElement {
    data: ButtonElementData;

    static schema = FormElement.schema.extend({
        label: z.string(),
        disabled: z.boolean(),
        variant: ButtonVariantFormatEnum,
    });

    constructor(data: PartialBy<ButtonElementData, ButtonElementOptionalKeys>) {
        super(data);
        this.data = ButtonElement.setDefaults(data);
    }

    protected static setDefaults(
        data: PartialBy<ButtonElementData, ButtonElementOptionalKeys>
    ): ButtonElementData {
        return {
            ...super.setDefaults(data),
            ...buttonElementDefaults,
            ...data,
        };
    }

    get label(): string {
        return this.data.label;
    }

    get disabled(): boolean {
        return this.data.disabled;
    }

    get variant(): ButtonVariantFormat {
        return this.data.variant;
    }

    abstract getButtonType():
        'submit' | 'reset' | 'nextWizardPage' | 'previousWizardPage';

    toUiSchema(_generator: SchemaGenerator, scope: string[] = []): UiButton {
        const uiSchema: UiButton = {
            type: 'Button',
            buttonType: this.getButtonType(),
            text: this.label,
            options: {
                disabled: this.disabled,
                variant: this.variant,
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
        // buttons have no data of their own
        return {};
    }

    static fromJsonSchemaAndUiSchema(
        _id: string,
        _jsonSchema: JSONSchema = {},
        uiSchema: AnyUiSchema
    ): ButtonElement {
        // base class fallback — subclasses (Reset/Submit) override this
        return new ResetButton({
            id: _id,
            label: isUiButton(uiSchema) ? (uiSchema.text ?? 'Reset') : 'Reset',
            disabled: isUiButton(uiSchema)
                ? (uiSchema.options?.disabled ?? false)
                : false,
        });
    }
}

type ResetButtonData = z.infer<typeof ResetButton.schema>;
const resetButtonDefaults = { type: 'reset-button' as const };
type ResetButtonOptionalKeys =
    keyof typeof resetButtonDefaults | ButtonElementOptionalKeys;

export class ResetButton extends ButtonElement {
    data: ResetButtonData;

    static schema = ButtonElement.schema.extend({
        type: z.literal('reset-button'),
    });

    constructor(
        data: Omit<PartialBy<ResetButtonData, ResetButtonOptionalKeys>, 'type'>
    ) {
        super(data);
        this.data = ResetButton.setDefaults(data);
    }

    protected static setDefaults(
        data: PartialBy<ResetButtonData, ResetButtonOptionalKeys>
    ): ResetButtonData {
        return {
            ...super.setDefaults(data),
            ...resetButtonDefaults,
            ...data,
        };
    }

    getButtonType(): 'reset' {
        return 'reset';
    }

    toUiSchema(_generator: SchemaGenerator, scope: string[] = []): UiButton {
        const uiSchema = super.toUiSchema(_generator, scope);
        uiSchema.buttonType = 'reset';
        return uiSchema;
    }

    static fromJsonSchemaAndUiSchema(
        id: string,
        _jsonSchema: JSONSchema = {},
        uiSchema: AnyUiSchema
    ): ResetButton {
        return new ResetButton({
            id: id,
            label: isUiButton(uiSchema) ? (uiSchema.text ?? 'Reset') : 'Reset',
            disabled: isUiButton(uiSchema)
                ? (uiSchema.options?.disabled ?? false)
                : false,
            variant:
                ((isUiButton(uiSchema)
                    ? uiSchema.options?.variant
                    : undefined) as ButtonVariantFormat | undefined) ??
                'primary',
        });
    }
}

type SubmitButtonData = z.infer<typeof SubmitButton.schema>;
const submitButtonDefaults = {
    type: 'submit-button' as const,
    // a fresh button must be valid without a URL — "save"/"print" need none,
    // "request" requires submitUrl + submitMethod (enforced in superRefine)
    submitAction: ButtonSubmitAction.Save,
    submitUrl: undefined as string | string[] | undefined,
    submitMethod: undefined as HttpsMethod | undefined,
};
type SubmitButtonOptionalKeys =
    keyof typeof submitButtonDefaults | ButtonElementOptionalKeys;

export class SubmitButton extends ButtonElement {
    data: SubmitButtonData;

    static schema = ButtonElement.schema
        .extend({
            type: z.literal('submit-button'),
            submitAction: z.enum(ButtonSubmitAction),
            submitUrl: z.array(z.url()).or(z.url()).optional(),
            submitMethod: HttpsMethodEnum.optional(),
            requestHeaders: z.record(z.string(), z.string()).optional(), // JSON string of key-value pairs
            onSuccessRedirectUrl: z.url().optional(),
            // TODO summary from ui schema definition?
        })
        .superRefine((data, ctx) => {
            if (data.submitAction === ButtonSubmitAction.Request) {
                if (!data.submitUrl || data.submitUrl.length === 0) {
                    ctx.addIssue({
                        code: 'custom',
                        message:
                            "submitUrl is required when submitAction is 'request'",
                        input: data,
                    });
                }
                // test that at least one of the submitUrl entries isnt an empty string
                const urls = Array.isArray(data.submitUrl)
                    ? data.submitUrl
                    : data.submitUrl
                      ? [data.submitUrl]
                      : [];
                if (data.submitUrl && urls.every((url) => url.trim() === '')) {
                    ctx.addIssue({
                        code: 'custom',
                        message:
                            "submitUrl must contain at least one non-empty URL when submitAction is 'request'",
                        input: data.submitUrl,
                    });
                }
                if (!data.submitMethod) {
                    ctx.addIssue({
                        code: 'custom',
                        message:
                            "submitMethod is required when submitAction is 'request'",
                        input: data,
                    });
                }
            }
        });

    constructor(
        data: Omit<
            PartialBy<SubmitButtonData, SubmitButtonOptionalKeys>,
            'type'
        >
    ) {
        super(data);
        this.data = SubmitButton.setDefaults(data);
    }

    protected static setDefaults(
        data: PartialBy<SubmitButtonData, SubmitButtonOptionalKeys>
    ): SubmitButtonData {
        return {
            ...super.setDefaults(data),
            ...submitButtonDefaults,
            ...data,
        };
    }

    get submitAction(): ButtonSubmitAction {
        return this.data.submitAction;
    }

    get submitUrl(): string | string[] {
        return this.data.submitUrl ?? '';
    }

    get submitMethod(): HttpsMethod | undefined {
        return this.data.submitMethod;
    }

    get requestHeaders(): Record<string, string> | undefined {
        return this.data.requestHeaders;
    }

    get onSuccessRedirectUrl(): string | undefined {
        return this.data.onSuccessRedirectUrl;
    }

    getButtonType(): 'submit' {
        return 'submit';
    }

    toUiSchema(_generator: SchemaGenerator, scope: string[] = []): UiButton {
        const uiSchema = super.toUiSchema(_generator, scope);
        uiSchema.buttonType = 'submit';

        // submitUrl is url | url[] — normalize to a non-empty tuple for the UI schema
        const submitUrls: [string, ...string[]] = Array.isArray(this.submitUrl)
            ? this.submitUrl.length > 0
                ? (this.submitUrl as [string, ...string[]])
                : ['']
            : [this.submitUrl ?? ''];
        const requestOptions: SubmitRequestOptions = {
            url: submitUrls,
            ...(this.submitMethod && { method: this.submitMethod }),
            ...(this.requestHeaders && { headers: this.requestHeaders }),
            ...(this.onSuccessRedirectUrl && {
                onSuccessRedirect: this.onSuccessRedirectUrl,
            }),
        };

        const submitOptions: SubmitOptions = {
            action: this.submitAction,
            ...(this.submitAction === ButtonSubmitAction.Request && {
                request: requestOptions,
            }),
        };

        uiSchema.options = {
            ...(uiSchema.options && { ...uiSchema.options }),
            submitOptions,
        };
        return uiSchema;
    }

    static fromJsonSchemaAndUiSchema(
        id: string,
        _jsonSchema: JSONSchema = {},
        uiSchema: AnyUiSchema
    ): SubmitButton {
        return new SubmitButton({
            id: id,
            label: isUiButton(uiSchema)
                ? (uiSchema.text ?? 'Submit')
                : 'Submit',
            disabled: isUiButton(uiSchema)
                ? (uiSchema.options?.disabled ?? false)
                : false,
            variant:
                ((isUiButton(uiSchema)
                    ? uiSchema.options?.variant
                    : undefined) as ButtonVariantFormat | undefined) ??
                'primary',
        });
    }
}
