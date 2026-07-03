// ─── Imports from @educorvi/vue-json-form-schemas ────────────────────────────
import type {
    Control,
    Layout,
    Options,
    ShowOnProperty,
    LegacyShowOnProperty,
    Button as VJFButton,
    HTMLRenderer as VJFHTMLRenderer,
    Divider as VJFDivider,
    JSONSchema,
    Buttongroup,
    Wizard,
    DescendantControlOverride,
    DescendantControlOverrides,
} from '@educorvi/vue-json-form-schemas';

// Re-export VJF types for use across the app
export type {
    Options,
    ShowOnProperty,
    LegacyShowOnProperty,
    JSONSchema,
    DescendantControlOverride,
    DescendantControlOverrides,
};

// ─── Editor-specific element types (VJF types extended with _id) ─────────────
type WithId<T> = T & { _id: string };

/** Form control element — a JSON Schema property reference with editor tracking id */
export type ControlElement = WithId<Control>;

export type DividerElement = WithId<VJFDivider>;
export type ButtonElement = WithId<VJFButton>;
export type HTMLElement_ = WithId<VJFHTMLRenderer & { type: 'HTML' }>;

/** Layout container (VerticalLayout, HorizontalLayout, Group). Extends VJF Layout with editor child types. */
export type LayoutElement = Omit<Layout, 'elements'> & {
    elements: FormElement[];
    _id: string;
};

/** A wizard page is structurally identical to a LayoutElement (VJF Wizard.pages are Layout[]). */
export type WizardPage = LayoutElement;

/** Wizard root. Extends VJF Wizard with editor-typed pages. */
export type WizardElement = Omit<Wizard, 'pages'> & {
    pages: WizardPage[];
    _id: string;
};

/** Button group. Extends VJF Buttongroup with our type name convention and editor-typed buttons. */
export type ButtonGroupElement = Omit<Buttongroup, 'type' | 'buttons'> & {
    type: 'ButtonGroup';
    buttons: ButtonElement[];
    _id: string;
};

/**
 * Object field — a nested schema object in the canvas.
 * Extends JSONSchema so all schema fields (properties, required, title, description, …)
 * are accessible directly. The editor-specific fields are overlaid.
 */
export type ObjectElement = Omit<JSONSchema, 'type'> & {
    type: 'Object';
    /** JSON schema property key */
    key: string;
    elements: FormElement[];
    showOn?: ShowOnProperty;
    options?: { cssClass?: string };
    _id: string;
};

/**
 * Array field — a repeatable item array in the canvas.
 * Extends JSONSchema so minItems, maxItems, items, title, … are all direct fields.
 * Item sub-properties live in `items.properties` (a nested JSONSchema).
 */
export type ArrayElement = Omit<JSONSchema, 'type'> & {
    type: 'Array';
    /** JSON schema property key */
    key: string;
    elements: FormElement[];
    showOn?: ShowOnProperty;
    options?: { cssClass?: string };
    _id: string;
};

// Union type for all form elements
export type FormElement =
    | ControlElement
    | LayoutElement
    | HTMLElement_
    | DividerElement
    | ButtonElement
    | ButtonGroupElement
    | ObjectElement
    | ArrayElement
    | WizardElement;

// ─── JSON Schema types ────────────────────────────────────────────────────────
// JSONSchema and JSONSchema are re-exported from VJF above.
// Use JSONSchema (from VJF) everywhere — it covers both root schemas and property schemas.

// ─── UI Schema ────────────────────────────────────────────────────────────────

export interface UISchema {
    version: string;
    layout: LayoutElement | WizardElement;
}

// ─── Field palette item ───────────────────────────────────────────────────────

export type FieldCategory = 'controls' | 'layout' | 'misc';

export interface PaletteField {
    id: string;
    label: string;
    icon: string;
    category?: FieldCategory;
    description: string;
    createElement: () => FormElement;
    createSchemaProperty?: () => { key: string; schema: JSONSchema };
}

export interface PaletteSection {
    id: string;
    label: string;
    icon?: string;
    fields?: PaletteField[];
    sections?: PaletteSection[];
}

// ─── Display mode ─────────────────────────────────────────────────────────────

export type DisplayMode = 'web' | 'mobile';
export type ThemeMode = 'light' | 'dark';
