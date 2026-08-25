import { z } from 'zod';
import type { JSONSchema } from '@educorvi/vue-json-form-schemas';

import { ArrayElement, ObjectElement } from './container';
import { StringElement } from './string';
import { ColorElement } from './color';
import { TimeElement } from './time';
import { NumberElement } from './number';
import { BooleanElement } from './boolean';
import { EnumElement, CheckboxGroupElement } from './selection';
import { FileuploadElement } from './file-upload';
import { ModalElement } from './modal';
import { ButtonGroupElement, ResetButton, SubmitButton } from './button';
import { DividerElement } from './divider';
import { ReferenceElement } from './reference';
import { HTMLElement } from './html';
import { FormElement } from './form-element';

// Registry
type FormElementConstructor = {
    new (...args: any[]): FormElement;
    schema: z.ZodTypeAny;
    fromJsonSchemaAndUiSchema(
        id: string,
        jsonSchema: JSONSchema,
        uiSchema: any
    ): FormElement;
};

export const FormElementRegistry = new Map<string, FormElementConstructor>([
    ['array', ArrayElement],
    ['object', ObjectElement],
    ['string', StringElement],
    ['color', ColorElement],
    ['time', TimeElement],
    ['number', NumberElement],
    ['integer', NumberElement],
    ['boolean', BooleanElement],
    ['enum', EnumElement],
    ['checkbox-group', CheckboxGroupElement],
    ['file-upload', FileuploadElement],
    ['modal', ModalElement],
    ['button-group', ButtonGroupElement],
    ['reset-button', ResetButton],
    ['submit-button', SubmitButton],
    ['reference', ReferenceElement],
    ['html', HTMLElement],
    ['divider', DividerElement],
]);
