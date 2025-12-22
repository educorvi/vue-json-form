import type { ErrorObject } from 'ajv';
import { Validator } from './Validation/Validator';

export type ValidationErrors = {
    general: Error[],
    jsonSchema: {
        validation: ErrorObject[],
        parsing: Error[]
    },
    uiSchema: {
        validation: ErrorObject[],
        parsing: Error[]
    }
}

export type ValidatorClass<T> = {
    new(): Validator<T>
}
