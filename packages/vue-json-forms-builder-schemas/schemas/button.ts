import { z } from 'zod';
import type {
    Button,
    Buttongroup,
    JSONSchema,
} from '@educorvi/vue-json-form-schemas';
import { FormElement, FormElementOptionalKeys } from './form-element';
import type { SchemaGenerator } from './schema-generator';
import { PartialBy } from './base';
import { createShowOnProperty } from './children-schema-utils';
import { ButtonVariantFormat, ButtonVariantFormatEnum } from './utils';
import buttonSchema from '@educorvi/vue-json-form-schemas/src/ui/button.schema.json';

enum ButtonSubmitAction {
    Request = 'request',
    Save = 'save',
    Print = 'print',
}

type HttpsMethodValue = NonNullable<
    NonNullable<
        NonNullable<NonNullable<Button['options']>['submitOptions']>['request']
    >['method']
>;
const HttpsMethodEnum = z.enum(
    buttonSchema.properties.options.properties.submitOptions.properties.request
        .properties.method.enum as [HttpsMethodValue, ...HttpsMethodValue[]]
);
export type HttpsMethod = z.infer<typeof HttpsMethodEnum>;

type ButtonGroupElementData = z.infer<typeof ButtonGroupElement.schema>;
const buttonGroupElementDefaults = {
    type: 'button-group' as const,
    buttons: [] as string[],
    vertical: false,
};
type ButtonGroupElementOptionalKeys =
    keyof typeof buttonGroupElementDefaults | FormElementOptionalKeys;

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
            buttons: [...buttonGroupElementDefaults.buttons], // clone so that each instance has its own array
            ...data,
        };
    }

    get buttons(): string[] {
        return this.data.buttons;
    }

    get vertical(): boolean {
        return this.data.vertical;
    }

    toUiSchema(_generator: SchemaGenerator, scope: string[] = []): Buttongroup {
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

        const uiSchema: Buttongroup = {
            type: 'Buttongroup',
            options: { vertical: this.vertical },
            buttons: buttons as [Button, ...Button[]], // TODO better handling?
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

    toJsonSchema(
        _generator: SchemaGenerator,
        scope: string[] = []
    ): JSONSchema {
        return {};
    }

    static fromJsonSchemaAndUiSchema(
        id: string,
        jsonSchema: JSONSchema = {},
        uiSchema: Button
    ): ButtonGroupElement {
        // TODO
        return new ButtonGroupElement({ id: id });
    }
}

type ButtonElementData = z.infer<typeof ButtonElement.schema>;
const buttonElementDefaults = { disabled: false, variant: 'primary' as const };
type ButtonElementOptionalKeys =
    keyof typeof buttonElementDefaults | FormElementOptionalKeys;

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

    toUiSchema(_generator: SchemaGenerator, scope: string[] = []): Button {
        const uiSchema: Button = {
            type: 'Button',
            buttonType: 'submit', // is replaced in subclass
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

    toJsonSchema(_generator: SchemaGenerator, scope: string[]): JSONSchema {
        return {};
    }

    static fromJsonSchemaAndUiSchema(
        id: string,
        jsonSchema: JSONSchema = {},
        uiSchema: Button
    ): ButtonElement {
        // TODO
        // base class fallback — subclasses (Reset/Submit) override this
        return new ResetButton({
            id: id,
            label: '',
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

    toUiSchema(_generator: SchemaGenerator, scope: string[] = []): Button {
        const uiSchema = super.toUiSchema(_generator, scope);
        uiSchema.buttonType = 'reset';
        return uiSchema;
    }

    static fromJsonSchemaAndUiSchema(
        id: string,
        jsonSchema: JSONSchema = {},
        uiSchema: Button
    ): ResetButton {
        // TODO
        return new ResetButton({
            id: id,
            label: '',
        });
    }
}

type SubmitButtonData = z.infer<typeof SubmitButton.schema>;
const submitButtonDefaults = {
    type: 'submit-button' as const,
    submitUrl: [''] as [string, ...string[]],
};
type SubmitButtonOptionalKeys =
    keyof typeof submitButtonDefaults | ButtonElementOptionalKeys;

export class SubmitButton extends ButtonElement {
    data: SubmitButtonData;

    static schema = ButtonElement.schema
        .extend({
            type: z.literal('submit-button'),
            submitAction: z.enum(ButtonSubmitAction),
            submitUrl: z.array(z.url()).or(z.url()),
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
                if (
                    data.submitUrl &&
                    data.submitUrl.every((url) => url.trim() === '')
                ) {
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
        return this.data.submitUrl;
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

    toUiSchema(_generator: SchemaGenerator, scope: string[] = []): Button {
        const uiSchema = super.toUiSchema(_generator, scope);
        uiSchema.buttonType = 'submit';

        const requestOptions = {
            url: this.submitUrl as [string, ...string[]], // TODO better handling?
            method: this.submitMethod,
            ...(this.requestHeaders && { headers: this.requestHeaders }),
            ...(this.onSuccessRedirectUrl && {
                onSuccessRedirect: this.onSuccessRedirectUrl,
            }),
        };

        uiSchema.options = {
            ...(uiSchema.options && { ...uiSchema.options }),
            submitOptions: {
                action: this.submitAction,
                ...(this.submitAction === ButtonSubmitAction.Request && {
                    request: requestOptions,
                }),
            },
        };
        return uiSchema;
    }

    static fromJsonSchemaAndUiSchema(
        id: string,
        jsonSchema: JSONSchema = {},
        uiSchema: Button
    ): SubmitButton {
        // TODO
        return new SubmitButton({
            id: id,
            label: '',
            submitUrl: '',
            submitAction: ButtonSubmitAction.Request,
        });
    }
}
