import { Validator } from './Validator';
import { UISchema } from '../generated/ui-schema';
import { JSONSchema } from '../index';

export class EmptyValidator extends Validator<never>{
    protected async initializeInternal(): Promise<void> {
        return;
    }

    protected validateJsonSchemaInternal(data: unknown): data is JSONSchema {
        if (import.meta.env.DEV) {
            console.debug(`Validation skipped for data`, data);
        }
        return true;
    }

    protected validateUiSchemaInternal(data: unknown): data is UISchema {
        if (import.meta.env.DEV) {
            console.debug(`Validation skipped for data`, data);
        }
        return true;
    }

    getJsonSchemaValidationErrors(): never[] {
        return [];
    }

    getUiSchemaValidationErrors(): never[] {
        return [];
    }

}
