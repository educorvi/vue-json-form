import { z } from "zod";
import { FormElement, FormElementOptionalKeys } from "./form-element";

// TODO
export class ReferenceElement extends FormElement {
    // id of the referenced element (of type )
    referenceId!: FormElement;

    schema = FormElement.schema.extend({
        referenceId: z.string()
    });
}