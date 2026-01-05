import { UISchema } from '../generated/ui-schema';
import { JSONSchema } from '../index';

export abstract class Validator<ValidationErrorType> {
    private initialized = false;
    protected abstract initializeInternal(): Promise<void>;
    protected abstract validateJsonSchemaInternal(data: unknown): data is JSONSchema;
    protected abstract validateUiSchemaInternal(data: unknown): data is UISchema;
    abstract getUiSchemaValidationErrors(): ValidationErrorType[]
    abstract getJsonSchemaValidationErrors(): ValidationErrorType[]


    async initialize(): Promise<void> {
        if (!this.initialized) {
            await this.initializeInternal();
            this.initialized = true;
        }
    }

    validateJsonSchema(data: unknown): data is JSONSchema {
        if (!this.initialized) {
            throw new Error('Validator not initialized');
        }
        return this.validateJsonSchemaInternal(data);
    }

    validateUiSchema(data: unknown): data is UISchema {
        if (!this.initialized) {
            throw new Error('Validator not initialized');
        }
        return this.validateUiSchemaInternal(data);
    }
}
