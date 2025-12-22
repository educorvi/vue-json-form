import { JSONSchema, UISchema, Validator } from '@educorvi/vue-json-form-schemas';
import { ErrorObject, type ValidateFunction } from 'ajv';

export class AjvValidator extends Validator<ErrorObject> {
    jsonValidationFunc: ValidateFunction | undefined;
    uiValidationFunc: ValidateFunction | undefined;

    protected validateJsonSchemaInternal(data: unknown): data is JSONSchema {
        return this.jsonValidationFunc ? this.jsonValidationFunc(data) : false;
    }

    protected validateUiSchemaInternal(data: unknown): data is UISchema {
        return this.uiValidationFunc ? this.uiValidationFunc(data) : false;
    }

    getJsonSchemaValidationErrors(): ErrorObject[] {
        return this.jsonValidationFunc?.errors ?? [];
    }

    getUiSchemaValidationErrors(): ErrorObject[] {
        return this.uiValidationFunc?.errors ?? [];
    }

    protected async initializeInternal(): Promise<void> {
        const { JsonSchema, UiSchema } = await import('./generated/validatorCode');
        this.jsonValidationFunc = JsonSchema;
        this.uiValidationFunc = UiSchema;
    }

}
