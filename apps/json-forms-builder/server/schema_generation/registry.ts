import { z } from "zod";
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';

import { ArrayElement, ObjectElement, ContainerElement } from "./elements/container";
import { StringElement } from "./elements/string";
import { NumberElement } from "./elements/number";
import { HTMLElement } from "./elements/html";
import { FormElement, BaseDataElement } from "./base";

// Registry
type FormElementConstructor = {
    new(...args: any[]): FormElement;
    schema: z.ZodTypeAny;
    fromJsonSchemaAndUiSchema(jsonSchema: JSONSchema, uiSchema: any): FormElement;
};

export const FormElementRegistry = new Map<string, FormElementConstructor>([
    ["array",   ArrayElement],
    ["object",  ObjectElement],
    ["string",  StringElement],
    ["number",  NumberElement],
    ["html",    HTMLElement],
]);