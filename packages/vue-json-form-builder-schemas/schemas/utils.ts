import type {
    Button,
    Buttongroup,
    Control,
    Divider,
    HTMLRenderer,
    Modal,
    JSONSchema,
} from '@educorvi/vue-json-form-schemas';
import { z } from 'zod';

/**
 * UI Schema version emitted by the element model. Must stay compatible with
 * the renderer's supported version (see `SUPPORTED_UISCHEMA_VERSION` in
 * @educorvi/vue-json-form) — older minor versions are accepted.
 */
export const UI_SCHEMA_VERSION = '2.2' as const;

export function createId(title: string): string {
    return title.toLowerCase().replace(/\s+/g, '_');
}

export enum Layout {
    Horizontal = 'HorizontalLayout',
    Vertical = 'VerticalLayout',
    Group = 'Group', // with line to the right of the elements
}

/** Every UI schema fragment a FormElement can emit. */
export type CombinedUiSchemaType =
    Control | HTMLRenderer | Divider | Button | Buttongroup | Modal;

/**
 * Button / modal variants. Values mirror
 * `variants.schema.json` in @educorvi/vue-json-form-schemas
 * (baseVariants + outlineVariants).
 */
const BUTTON_VARIANT_VALUES = [
    'primary',
    'secondary',
    'success',
    'warning',
    'danger',
    'info',
    'light',
    'dark',
    'outline-primary',
    'outline-secondary',
    'outline-success',
    'outline-warning',
    'outline-danger',
    'outline-info',
    'outline-light',
    'outline-dark',
] as const;

export const ButtonVariantFormatEnum = z.enum(BUTTON_VARIANT_VALUES);
export type ButtonVariantFormat = z.infer<typeof ButtonVariantFormatEnum>;

/** Removes empty `options` objects from a UI schema Control. */
export function cleanUiSchema(uiSchema: Control): void {
    if (uiSchema.options && Object.keys(uiSchema.options).length === 0) {
        delete uiSchema.options;
    }
}

export function getBaseJsonSchema(
    type: 'array' | 'object',
    title: string,
    description?: string
): JSONSchema {
    const schema: JSONSchema = {
        type: type,
        title: title,
    };
    if (description !== undefined) {
        schema.description = description;
    }
    return schema;
}
