import { JSONSchema, UISchema, ValidationError, Validator } from '@educorvi/vue-json-form-schemas';
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

    private mapErrors(errors: ErrorObject[]): ValidationError<ErrorObject>[] {
        return errors.map(error => {
            return {
                title: error.keyword,
                path: error.instancePath,
                message: error.message,
                originalError: error,
            };
        });
    }

    getJsonSchemaValidationErrors() {
        return this.mapErrors(this.jsonValidationFunc?.errors ?? []);
    }

    getUiSchemaValidationErrors() {
        return this.mapErrors(this.uiValidationFunc?.errors ?? []);
    }

    protected async initializeInternal(): Promise<void> {
        const { JsonSchema, UiSchema } = await import('./generated/validatorCode');
        this.jsonValidationFunc = JsonSchema;
        this.uiValidationFunc = UiSchema;
    }

}
