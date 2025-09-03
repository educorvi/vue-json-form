import { Validator } from './Validator';
import { CoreSchemaMetaSchema } from '../generated/json-schema';
import { UISchema } from '../generated/ui-schema';

export class EmptyValidator extends Validator<never>{
    protected async initializeInternal(): Promise<void> {
        return;
    }

    protected validateJsonSchemaInternal(data: unknown): data is CoreSchemaMetaSchema {
        console.debug(`Validation skipped for data`, data)
        return true;
    }

    protected validateUiSchemaInternal(data: unknown): data is UISchema {
        console.debug(`Validation skipped for data`, data)
        return true;
    }

    getJsonSchemaValidationErrors(): never[] {
        return [];
    }

    getUiSchemaValidationErrors(): never[] {
        return [];
    }

}
