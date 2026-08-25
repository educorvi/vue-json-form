import {
    StringElement,
    ColorElement,
    TimeElement,
    NumberElement,
    BooleanElement,
    EnumElement,
    CheckboxGroupElement,
    FileuploadElement,
    HTMLElement,
    DividerElement,
    ModalElement,
    ResetButton,
    SubmitButton,
    ButtonGroupElement,
    ArrayElement,
    ObjectElement,
    ReferenceElement,
    StringFormat,
    TimeFormat,
    NumberFormat,
    EnumFormat,
    ModalSize,
    createId,
    type FormElement,
} from '@educorvi/vue-json-forms-builder-schemas';

/**
 * Palette model — the left sidebar entries. Every entry references the
 * element classes from the form schema definitions package (no duplicated
 * data model), carries an icon and is grouped into collapsible categories.
 *
 * Drag & drop flow:
 *   PaletteFieldGrid clones a field as a `palette:<fieldId>` marker string
 *   (see PALETTE_MARKER_PREFIX) into the DropZone's uid list; DropZone
 *   resolves the field via getPaletteField() and calls builder.addElement()
 *   with the field id. Type filtering during the drag uses
 *   `field.elementType` (the registry type, e.g. 'string' for every string
 *   format variant), which is written to `dragEl.dataset.elementType`.
 */

export type PaletteElementType =
    | 'text'
    | 'textarea'
    | 'email'
    | 'password'
    | 'hidden'
    | 'date'
    | 'datetime'
    | 'time'
    | 'uri'
    | 'phone'
    | 'color'
    | 'search'
    | 'number'
    | 'integer'
    | 'boolean'
    | 'select'
    | 'radio'
    | 'switches'
    | 'buttons'
    | 'checkbox-group'
    | 'file-upload'
    | 'html'
    | 'divider'
    | 'modal'
    | 'submit-button'
    | 'reset-button'
    | 'button-group'
    | 'reference'
    | 'array'
    | 'object';

/**
 * Marker prefix for palette clones inserted into a DropZone's uid list while
 * dragging; DropZone.onChildAdd replaces it with a real element via
 * builder.addElement(parent, fieldId, idx).
 */
export const PALETTE_MARKER_PREFIX = 'palette:';

export interface PaletteField {
    /** unique palette id — also used as the drag marker (`palette:<id>`) */
    id: PaletteElementType;
    label: string;
    icon: string;
    description: string;
    /**
     * Registry type used for drop-zone type filtering (e.g. every string
     * format variant filters as 'string').
     */
    elementType: string;
    /**
     * Builds a fresh element (or a small subtree, e.g. button-group with its
     * buttons) for this field. `takenIds` keeps generated ids collision-free.
     */
    createElement: (takenIds: Set<string>) => FormElement | FormElement[];
}

export interface PaletteSection {
    id: string;
    label: string;
    icon: string;
    fields?: PaletteField[];
    sections?: PaletteSection[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function uniqueId(base: string, takenIds: Set<string>): string {
    let id = createId(base);
    if (takenIds && takenIds.has(id)) {
        let i = 2;
        while (takenIds.has(`${id}_${i}`)) i++;
        id = `${id}_${i}`;
    }
    return id;
}

// ── Data: Input ──────────────────────────────────────────────────────────────

function stringField(
    id: PaletteElementType,
    label: string,
    icon: string,
    format: StringFormat
): PaletteField {
    return {
        id,
        label,
        icon,
        description: `${label} input`,
        elementType: 'string',
        createElement: (takenIds) =>
            new StringElement({
                id: uniqueId(label, takenIds),
                title: label,
                required: false,
                format,
            }),
    };
}

const inputFields: PaletteField[] = [
    stringField('text', 'Text', 'bi bi-pencil', StringFormat.Text),
    {
        id: 'textarea',
        label: 'Textarea',
        icon: 'bi bi-textarea-t',
        description: 'Multiline text input',
        elementType: 'string',
        createElement: (takenIds) =>
            new StringElement({
                id: uniqueId('textarea', takenIds),
                title: 'Textarea',
                required: false,
                format: StringFormat.Text,
                multi: true,
            }),
    },
    stringField('email', 'Email', 'bi bi-envelope', StringFormat.Email),
    stringField('password', 'Password', 'bi bi-lock', StringFormat.Password),
    {
        id: 'date',
        label: 'Date',
        icon: 'bi bi-calendar',
        description: 'Date input',
        elementType: 'time',
        createElement: (takenIds) =>
            new TimeElement({
                id: uniqueId('date', takenIds),
                title: 'Date',
                required: false,
                format: TimeFormat.Date,
            }),
    },
    {
        id: 'datetime',
        label: 'Date & Time',
        icon: 'bi bi-calendar-range',
        description: 'Date and time input',
        elementType: 'time',
        createElement: (takenIds) =>
            new TimeElement({
                id: uniqueId('datetime', takenIds),
                title: 'Date & Time',
                required: false,
                format: TimeFormat.DateTimeLocal,
            }),
    },
    {
        id: 'time',
        label: 'Time',
        icon: 'bi bi-clock',
        description: 'Time input',
        elementType: 'time',
        createElement: (takenIds) =>
            new TimeElement({
                id: uniqueId('time', takenIds),
                title: 'Time',
                required: false,
                format: TimeFormat.Time,
            }),
    },
    stringField('uri', 'URL', 'bi bi-link', StringFormat.Uri),
    stringField('phone', 'Phone', 'bi bi-phone', StringFormat.Tel),
    {
        id: 'color',
        label: 'Color',
        icon: 'bi bi-palette',
        description: 'Color picker input',
        elementType: 'color',
        createElement: (takenIds) =>
            new ColorElement({
                id: uniqueId('color', takenIds),
                title: 'Color',
                required: false,
            }),
    },
    stringField('search', 'Search', 'bi bi-search', StringFormat.Search),
    stringField('hidden', 'Hidden', 'bi bi-eye-slash', StringFormat.Hidden),
];

// ── Data: Numeric ────────────────────────────────────────────────────────────

const numericFields: PaletteField[] = [
    {
        id: 'number',
        label: 'Number',
        icon: 'bi bi-123',
        description: 'Decimal number input',
        elementType: 'number',
        createElement: (takenIds) =>
            new NumberElement({
                id: uniqueId('number', takenIds),
                title: 'Number',
                required: false,
                format: NumberFormat.Number,
            }),
    },
    {
        id: 'integer',
        label: 'Integer',
        icon: 'bi bi-calculator',
        description: 'Whole number input',
        elementType: 'integer',
        createElement: (takenIds) =>
            new NumberElement({
                id: uniqueId('integer', takenIds),
                title: 'Integer',
                required: false,
                format: NumberFormat.Integer,
            }),
    },
];

// ── Data: Boolean ────────────────────────────────────────────────────────────

const booleanFields: PaletteField[] = [
    {
        id: 'boolean',
        label: 'Checkbox',
        icon: 'bi bi-check-square',
        description: 'True/false checkbox',
        elementType: 'boolean',
        createElement: (takenIds) =>
            new BooleanElement({
                id: uniqueId('checkbox', takenIds),
                title: 'Checkbox',
                required: false,
            }),
    },
];

// ── Data: Enum ───────────────────────────────────────────────────────────────

const enumFields: PaletteField[] = [
    {
        id: 'select',
        label: 'Select',
        icon: 'bi bi-list',
        description: 'Dropdown select from enum values',
        elementType: 'enum',
        createElement: (takenIds) =>
            new EnumElement({
                id: uniqueId('select', takenIds),
                title: 'Select',
                required: false,
                format: EnumFormat.Select,
                values: ['option1', 'option2', 'option3'],
            }),
    },
    {
        id: 'radio',
        label: 'Radio',
        icon: 'bi bi-ui-radios',
        description: 'Radio button group',
        elementType: 'enum',
        createElement: (takenIds) =>
            new EnumElement({
                id: uniqueId('radio', takenIds),
                title: 'Radio Group',
                required: false,
                format: EnumFormat.Radiobuttons,
                values: ['option1', 'option2'],
            }),
    },
    {
        id: 'switches',
        label: 'Switches',
        icon: 'bi bi-toggle-on',
        description: 'Switch list (true/false toggles)',
        elementType: 'enum',
        createElement: (takenIds) =>
            new EnumElement({
                id: uniqueId('switches', takenIds),
                title: 'Switches',
                required: false,
                format: EnumFormat.Switches,
                values: ['option1', 'option2'],
            }),
    },
    {
        id: 'buttons',
        label: 'Button Select',
        icon: 'bi bi-ui-buttons',
        description: 'Button list selection',
        elementType: 'enum',
        createElement: (takenIds) =>
            new EnumElement({
                id: uniqueId('buttons', takenIds),
                title: 'Button Select',
                required: false,
                format: EnumFormat.Buttons,
                values: ['option1', 'option2'],
            }),
    },
    {
        id: 'checkbox-group',
        label: 'Checkbox Group',
        icon: 'bi bi-check2-square',
        description: 'Multi-select checkbox group',
        elementType: 'checkbox-group',
        createElement: (takenIds) =>
            new CheckboxGroupElement({
                id: uniqueId('checkbox_group', takenIds),
                title: 'Checkbox Group',
                required: false,
                values: ['option1', 'option2'],
            }),
    },
];

// ── Data: File ───────────────────────────────────────────────────────────────

const fileFields: PaletteField[] = [
    {
        id: 'file-upload',
        label: 'File Upload',
        icon: 'bi bi-file-earmark-arrow-up',
        description: 'File upload input',
        elementType: 'file-upload',
        createElement: (takenIds) =>
            new FileuploadElement({
                id: uniqueId('file_upload', takenIds),
                title: 'File Upload',
                required: false,
            }),
    },
];

// ── Miscellaneous ────────────────────────────────────────────────────────────

const miscFields: PaletteField[] = [
    {
        id: 'html',
        label: 'HTML',
        icon: 'bi bi-code',
        description: 'Render custom HTML content',
        elementType: 'html',
        createElement: (takenIds) =>
            new HTMLElement({
                id: uniqueId('html', takenIds),
                htmlData: '<p>Enter your HTML here</p>',
            }),
    },
    {
        id: 'modal',
        label: 'Modal',
        icon: 'bi bi-window',
        description: 'Button that opens an info modal',
        elementType: 'modal',
        createElement: (takenIds) =>
            new ModalElement({
                id: uniqueId('modal', takenIds),
                title: 'Modal Title',
                content: '<p>Modal content</p>',
                buttonLabel: 'Open',
                size: ModalSize.Medium,
                buttonVariant: 'primary',
            }),
    },
    {
        id: 'divider',
        label: 'Divider',
        icon: 'bi bi-hr',
        description: 'Horizontal divider line',
        elementType: 'divider',
        createElement: (takenIds) =>
            new DividerElement({
                id: uniqueId('divider', takenIds),
            }),
    },
    {
        id: 'submit-button',
        label: 'Submit Button',
        icon: 'bi bi-send',
        description: 'Button that submits the form',
        elementType: 'submit-button',
        createElement: (takenIds) =>
            new SubmitButton({
                id: uniqueId('submit', takenIds),
                label: 'Submit',
            }),
    },
    {
        id: 'reset-button',
        label: 'Reset Button',
        icon: 'bi bi-arrow-counterclockwise',
        description: 'Button that resets the form',
        elementType: 'reset-button',
        createElement: (takenIds) =>
            new ResetButton({
                id: uniqueId('reset', takenIds),
                label: 'Reset',
            }),
    },
    {
        id: 'button-group',
        label: 'Button Group',
        icon: 'bi bi-justify',
        description: 'Group of action buttons',
        elementType: 'button-group',
        createElement: (takenIds) => {
            const group = new ButtonGroupElement({
                id: uniqueId('button_group', takenIds),
            });
            const reset = new ResetButton({
                id: uniqueId('cancel', takenIds),
                label: 'Cancel',
            });
            const submit = new SubmitButton({
                id: uniqueId('submit', takenIds),
                label: 'Submit',
            });
            group.data.buttons = [reset.uid, submit.uid];
            return [group, reset, submit];
        },
    },
    {
        id: 'reference',
        label: 'Reference',
        icon: 'bi bi-link-45deg',
        description: 'Reference another element of the form',
        elementType: 'reference',
        createElement: (takenIds) =>
            new ReferenceElement({
                id: uniqueId('reference', takenIds),
                referenceId: '',
            }),
    },
];

// ── Complex ──────────────────────────────────────────────────────────────────

const complexFields: PaletteField[] = [
    {
        id: 'object',
        label: 'Object',
        icon: 'bi bi-box',
        description: 'Nested object with sub-properties',
        elementType: 'object',
        createElement: (takenIds) =>
            new ObjectElement({
                id: uniqueId('object', takenIds),
                title: 'Object',
            }),
    },
    {
        id: 'array',
        label: 'Array',
        icon: 'bi bi-list-ul',
        description: 'Repeatable array of items',
        elementType: 'array',
        createElement: (takenIds) =>
            new ArrayElement({
                id: uniqueId('array', takenIds),
                title: 'Array',
                required: false,
            }),
    },
];

// ── Hierarchical palette sections (collapsible in the left panel) ───────────

export const paletteSections: PaletteSection[] = [
    {
        id: 'data',
        label: 'Data',
        icon: 'bi bi-database',
        sections: [
            {
                id: 'input',
                label: 'Input',
                icon: 'bi bi-pencil',
                fields: inputFields,
            },
            {
                id: 'numeric',
                label: 'Numeric',
                icon: 'bi bi-123',
                fields: numericFields,
            },
            {
                id: 'boolean',
                label: 'Boolean',
                icon: 'bi bi-check-square',
                fields: booleanFields,
            },
            {
                id: 'enum',
                label: 'Enum',
                icon: 'bi bi-list',
                fields: enumFields,
            },
            {
                id: 'file',
                label: 'File',
                icon: 'bi bi-file-earmark-arrow-up',
                fields: fileFields,
            },
        ],
    },
    {
        id: 'misc',
        label: 'Miscellaneous',
        icon: 'bi bi-wrench',
        fields: miscFields,
    },
    {
        id: 'complex',
        label: 'Complex',
        icon: 'bi bi-braces',
        fields: complexFields,
    },
];

// ── Lookups ──────────────────────────────────────────────────────────────────

/** Flattened list of all fields — used for search. */
export function getAllPaletteFields(): PaletteField[] {
    function flatten(sections: PaletteSection[]): PaletteField[] {
        return sections.flatMap((s) => [
            ...(s.fields ?? []),
            ...flatten(s.sections ?? []),
        ]);
    }
    return flatten(paletteSections);
}

/**
 * Recursively filter the section tree by a search query. Keeps the section
 * structure (so the left panel renders the same collapsible cards while
 * searching) but drops every field that does not match and every section
 * that ends up empty.
 */
export function filterPaletteSections(
    sections: PaletteSection[],
    query: string
): PaletteSection[] {
    const q = query.toLowerCase().trim();
    if (!q) return sections;
    const result: PaletteSection[] = [];
    for (const section of sections) {
        const fields = (section.fields ?? []).filter(
            (f) =>
                f.label.toLowerCase().includes(q) ||
                f.description.toLowerCase().includes(q)
        );
        const subsections = section.sections
            ? filterPaletteSections(section.sections, q)
            : undefined;
        if (fields.length > 0 || (subsections && subsections.length > 0)) {
            result.push({
                ...section,
                fields: fields.length > 0 ? fields : undefined,
                sections:
                    subsections && subsections.length > 0
                        ? subsections
                        : undefined,
            });
        }
    }
    return result;
}

const fieldById = new Map<PaletteElementType, PaletteField>(
    getAllPaletteFields().map((f) => [f.id, f])
);

export function getPaletteField(id: string): PaletteField | undefined {
    return fieldById.get(id as PaletteElementType);
}

/**
 * Build a fresh element subtree for a palette field (first element = root).
 * `takenIds` keeps generated ids collision-free.
 */
export function createPaletteElements(
    fieldId: PaletteElementType,
    takenIds?: Set<string>
): FormElement[] {
    const field = fieldById.get(fieldId);
    if (!field) throw new Error(`Unknown palette field "${fieldId}"`);
    const created = field.createElement(takenIds ?? new Set());
    return Array.isArray(created) ? created : [created];
}

/**
 * Registry types that are allowed inside an array container. Palette fields
 * filter with their `elementType` (registry type), canvas elements with
 * their `data.type` — so both spellings are listed here.
 */
export const ARRAY_ALLOWED_TYPES: string[] = [
    // registry types (canvas drags + palette elementType)
    'string',
    'number',
    'integer',
    'boolean',
    'enum',
    'checkbox-group',
    'file-upload',
    // containers
    'array',
    'object',
];

/** All ids currently present in a FormDefinition (for collision-free naming). */
export function collectTakenIds(
    formDefinition: import('@educorvi/vue-json-forms-builder-schemas').FormDefinition
): Set<string> {
    const ids = new Set<string>();
    for (const element of formDefinition.nodesIndex.values()) {
        ids.add(element.id);
    }
    return ids;
}
