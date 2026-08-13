import type { JSONSchema, Control, HTMLRenderer, Divider, Button, Buttongroup, Modal, UISchema } from '@educorvi/vue-json-form-schemas';
import { z } from "zod";
import variantsSchema from "@educorvi/vue-json-form-schemas/src/ui/variants.schema.json";
import type { OutlineVariants, BaseVariants } from "@educorvi/vue-json-form-schemas";

export function createId(title: string): string {
    return title.toLowerCase().replace(/\s+/g, '_');
}

export enum Layout {
    Horizontal = "HorizontalLayout",
    Vertical = "VerticalLayout",
    Group = "Group" // with line to the right of the elements
}

export type CombinedUiSchemaType = Control | HTMLRenderer | Divider | Button | Buttongroup | Modal;


type ButtonVariantFormatValue = NonNullable<BaseVariants | OutlineVariants>;
export const ButtonVariantFormatEnum = z.enum([
  ...variantsSchema.definitions.baseVariants.enum,
  ...variantsSchema.definitions.outlineVariants.enum,
] as [ButtonVariantFormatValue, ...ButtonVariantFormatValue[]]);
export type ButtonVariantFormat = z.infer<typeof ButtonVariantFormatEnum>;

export function cleanUiSchema(uiSchema: Control): void {
    if (uiSchema.options && Object.keys(uiSchema.options).length === 0) {
        delete uiSchema.options;
    }
}
