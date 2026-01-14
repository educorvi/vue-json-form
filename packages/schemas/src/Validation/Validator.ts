import { UISchema } from '../generated/ui-schema';
import { JSONSchema, ValidationError } from '../index';

export abstract class Validator<E> {
    private initialized = false;
    protected abstract initializeInternal(): Promise<void>;
    protected abstract validateJsonSchemaInternal(data: unknown): data is JSONSchema;
    protected abstract validateUiSchemaInternal(data: unknown): data is UISchema;
    abstract getUiSchemaValidationErrors(): ValidationError<E>[]
    abstract getJsonSchemaValidationErrors(): ValidationError<E>[]


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
