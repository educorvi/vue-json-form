import { Validator } from './Validation/Validator';

export type ValidationError<E> = {
    /**
     * Title of this validation error
     */
    title: string;

    /**
     * Path to where in the JSON the violation occurred
     */
    path: string;

    /**
     * Additional message to display
     */
    message?: string;

    /**
     * Original error object
     */
    originalError?: E
}

export type ValidationErrors<E> = {
    general: Error[],
    jsonSchema: {
        validation: ValidationError<E>[],
        parsing: Error[]
    },
    uiSchema: {
        validation: ValidationError<E>[],
        parsing: Error[]
    }
}

export type ValidatorClass<E> = {
    new(): Validator<E>
}
