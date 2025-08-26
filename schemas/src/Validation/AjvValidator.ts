import { Validator } from './Validator';
import type { Ajv, ErrorObject, ValidateFunction } from 'ajv';
import type { CoreSchemaMetaSchema } from '../generated/json-schema';
import type { UISchema } from '../generated/ui-schema';

export class AjvValidator extends Validator<ErrorObject>{
    ajv: Ajv | undefined;
    jsonValidationFunc: ValidateFunction | undefined;
    uiValidationFunc: ValidateFunction | undefined;
    protected async initializeInternal(): Promise<void> {
        const { default: Ajv } = await import('ajv');
        const {default: addFormats} = await import('ajv-formats');
        const uiSchema = (await import('../generated/ui-merged.schema.json')).default;
        const ajv = new Ajv();
        addFormats(ajv);
        this.jsonValidationFunc =
            ajv.getSchema('https://json-schema.org/draft-07/schema') ??
            ajv.getSchema('http://json-schema.org/draft-07/schema');

        this.uiValidationFunc = ajv.compile(uiSchema);

    }

    protected validateJsonSchemaInternal(data: unknown): data is CoreSchemaMetaSchema {
        return this.jsonValidationFunc ? this.jsonValidationFunc(data) :false;
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

}
