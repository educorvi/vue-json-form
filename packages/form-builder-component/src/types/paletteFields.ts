import { v4 as uuidv4 } from 'uuid';
import type {
    PaletteField,
    PaletteSection,
    FormElement,
} from '@/types/formTypes';
import { ButtonGroupNode } from '@/types/elements/nodes/ButtonGroupNode.ts';

function id() {
    return uuidv4();
}

function uniqueKey(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).slice(2, 6)}`;
}

// ── Layouts ────────────────────────────────────────────────────────────────────
// TODO use icons from Node Classes
const layoutFields: PaletteField[] = [
    {
        id: 'vertical',
        label: 'Vertical',
        icon: 'bi bi-list',
        description: 'Stack elements vertically',
        createElement: (): FormElement => ({
            type: 'VerticalLayout',
            elements: [],
            _id: id(),
        }),
    },
    {
        id: 'horizontal',
        label: 'Horizontal',
        icon: 'bi bi-table',
        description: 'Place elements side by side',
        createElement: (): FormElement => ({
            type: 'HorizontalLayout',
            elements: [],
            _id: id(),
        }),
    },
    {
        id: 'group',
        label: 'Group',
        icon: 'bi bi-folder',
        description: 'Group elements in a labeled section',
        createElement: (): FormElement => ({
            type: 'Group',
            elements: [],
            options: { label: 'Group' },
            _id: id(),
        }),
    },
];

// ── Misc ───────────────────────────────────────────────────────────────────────

const miscFields: PaletteField[] = [
    {
        id: 'html',
        label: 'HTML',
        icon: 'bi bi-code',
        description: 'Render custom HTML content',
        createElement: (): FormElement => ({
            type: 'HTML',
            htmlData: '<p>Enter your HTML here</p>',
            _id: id(),
        }),
    },
    {
        id: 'divider',
        label: 'Divider',
        icon: 'bi bi-dash-lg',
        description: 'Visual separator line',
        createElement: (): FormElement => ({ type: 'Divider', _id: id() }),
    },
    {
        id: 'button',
        label: 'Button',
        icon: 'bi bi-send',
        description: 'Submit, Reset or navigation button',
        createElement: (): FormElement => ({
            type: 'Button',
            buttonType: 'submit',
            text: 'Submit',
            _id: id(),
        }),
    },
    {
        id: 'buttongroup',
        label: 'Button Group',
        icon: ButtonGroupNode.icon,
        description: 'Group of action buttons',
        createElement: (): FormElement => ({
            type: 'ButtonGroup',
            buttons: [
                {
                    type: 'Button',
                    buttonType: 'reset',
                    text: 'Cancel',
                    _id: id(),
                },
                {
                    type: 'Button',
                    buttonType: 'submit',
                    text: 'Submit',
                    _id: id(),
                },
            ],
            _id: id(),
        }),
    },
];

// ── Data: Input ────────────────────────────────────────────────────────────────

const inputFields: PaletteField[] = [
    {
        id: 'text',
        label: 'Text',
        icon: 'bi bi-pencil',
        description: 'Single-line text input',
        createElement: (): FormElement => ({
            type: 'Control',
            scope: `/properties/${uniqueKey('text')}`,
            _id: id(),
        }),
        createSchemaProperty: () => {
            const key = uniqueKey('text');
            return { key, schema: { type: 'string', title: 'Text Field' } };
        },
    },
    {
        id: 'textarea',
        label: 'Textarea',
        icon: 'bi bi-textarea-t',
        description: 'Multi-line text input',
        createElement: (): FormElement => ({
            type: 'Control',
            scope: `/properties/${uniqueKey('text')}`,
            options: { multi: true },
            _id: id(),
        }),
        createSchemaProperty: () => {
            const key = uniqueKey('text');
            return { key, schema: { type: 'string', title: 'Text Area' } };
        },
    },
    {
        id: 'email',
        label: 'Email',
        icon: 'bi bi-envelope',
        description: 'Email address input',
        createElement: (): FormElement => ({
            type: 'Control',
            scope: `/properties/${uniqueKey('email')}`,
            options: { format: 'email' },
            _id: id(),
        }),
        createSchemaProperty: () => {
            const key = uniqueKey('email');
            return {
                key,
                schema: { type: 'string', format: 'email', title: 'Email' },
            };
        },
    },
    {
        id: 'password',
        label: 'Password',
        icon: 'bi bi-lock',
        description: 'Password (masked) input',
        createElement: (): FormElement => ({
            type: 'Control',
            scope: `/properties/${uniqueKey('pass')}`,
            options: { format: 'password' },
            _id: id(),
        }),
        createSchemaProperty: () => {
            const key = uniqueKey('pass');
            return { key, schema: { type: 'string', title: 'Password' } };
        },
    },
    {
        id: 'url',
        label: 'URL',
        icon: 'bi bi-link',
        description: 'Web address input',
        createElement: (): FormElement => ({
            type: 'Control',
            scope: `/properties/${uniqueKey('url')}`,
            options: { format: 'url' },
            _id: id(),
        }),
        createSchemaProperty: () => {
            const key = uniqueKey('url');
            return {
                key,
                schema: { type: 'string', format: 'uri', title: 'URL' },
            };
        },
    },
    {
        id: 'tel',
        label: 'Phone',
        icon: 'bi bi-phone',
        description: 'Telephone number input',
        createElement: (): FormElement => ({
            type: 'Control',
            scope: `/properties/${uniqueKey('tel')}`,
            options: { format: 'tel' },
            _id: id(),
        }),
        createSchemaProperty: () => {
            const key = uniqueKey('tel');
            return { key, schema: { type: 'string', title: 'Phone' } };
        },
    },
    {
        id: 'date',
        label: 'Date',
        icon: 'bi bi-calendar',
        description: 'Date picker',
        createElement: (): FormElement => ({
            type: 'Control',
            scope: `/properties/${uniqueKey('date')}`,
            options: { format: 'date' },
            _id: id(),
        }),
        createSchemaProperty: () => {
            const key = uniqueKey('date');
            return {
                key,
                schema: { type: 'string', format: 'date', title: 'Date' },
            };
        },
    },
    {
        id: 'time',
        label: 'Time',
        icon: 'bi bi-clock',
        description: 'Time picker',
        createElement: (): FormElement => ({
            type: 'Control',
            scope: `/properties/${uniqueKey('time')}`,
            options: { format: 'time' },
            _id: id(),
        }),
        createSchemaProperty: () => {
            const key = uniqueKey('time');
            return {
                key,
                schema: { type: 'string', format: 'time', title: 'Time' },
            };
        },
    },
    {
        id: 'datetime',
        label: 'Date & Time',
        icon: 'bi bi-calendar-range',
        description: 'Date and time picker',
        createElement: (): FormElement => ({
            type: 'Control',
            scope: `/properties/${uniqueKey('dt')}`,
            options: { format: 'datetime-local' },
            _id: id(),
        }),
        createSchemaProperty: () => {
            const key = uniqueKey('dt');
            return {
                key,
                schema: {
                    type: 'string',
                    format: 'date-time',
                    title: 'Date & Time',
                },
            };
        },
    },
    {
        id: 'color',
        label: 'Color',
        icon: 'bi bi-palette',
        description: 'Color picker input',
        createElement: (): FormElement => ({
            type: 'Control',
            scope: `/properties/${uniqueKey('color')}`,
            options: { format: 'color' },
            _id: id(),
        }),
        createSchemaProperty: () => {
            const key = uniqueKey('color');
            return {
                key,
                schema: { type: 'string', format: 'color', title: 'Color' },
            };
        },
    },
    {
        id: 'search',
        label: 'Search',
        icon: 'bi bi-search',
        description: 'Search input field',
        createElement: (): FormElement => ({
            type: 'Control',
            scope: `/properties/${uniqueKey('search')}`,
            options: { format: 'search' },
            _id: id(),
        }),
        createSchemaProperty: () => {
            const key = uniqueKey('search');
            return { key, schema: { type: 'string', title: 'Search' } };
        },
    },
    {
        id: 'hidden',
        label: 'Hidden',
        icon: 'bi bi-eye-slash',
        description: 'Hidden form field',
        createElement: (): FormElement => ({
            type: 'Control',
            scope: `/properties/${uniqueKey('hidden')}`,
            options: { format: 'hidden' },
            _id: id(),
        }),
        createSchemaProperty: () => {
            const key = uniqueKey('hidden');
            return { key, schema: { type: 'string', title: 'Hidden Field' } };
        },
    },
];

// ── Data: Numeric ──────────────────────────────────────────────────────────────

const numericFields: PaletteField[] = [
    {
        id: 'number',
        label: 'Number',
        icon: 'bi bi-123',
        description: 'Decimal number input',
        createElement: (): FormElement => ({
            type: 'Control',
            scope: `/properties/${uniqueKey('num')}`,
            _id: id(),
        }),
        createSchemaProperty: () => {
            const key = uniqueKey('num');
            return { key, schema: { type: 'number', title: 'Number' } };
        },
    },
    {
        id: 'integer',
        label: 'Integer',
        icon: 'bi bi-calculator',
        description: 'Whole number input',
        createElement: (): FormElement => ({
            type: 'Control',
            scope: `/properties/${uniqueKey('int')}`,
            _id: id(),
        }),
        createSchemaProperty: () => {
            const key = uniqueKey('int');
            return { key, schema: { type: 'integer', title: 'Integer' } };
        },
    },
];

// ── Data: Boolean ──────────────────────────────────────────────────────────────

const booleanFields: PaletteField[] = [
    {
        id: 'checkbox',
        label: 'Checkbox',
        icon: 'bi bi-check-square',
        description: 'True/false checkbox',
        createElement: (): FormElement => ({
            type: 'Control',
            scope: `/properties/${uniqueKey('bool')}`,
            _id: id(),
        }),
        createSchemaProperty: () => {
            const key = uniqueKey('bool');
            return { key, schema: { type: 'boolean', title: 'Checkbox' } };
        },
    },
];

// ── Data: Enum ─────────────────────────────────────────────────────────────────

const enumFields: PaletteField[] = [
    {
        id: 'select',
        label: 'Select',
        icon: 'bi bi-list',
        description: 'Dropdown select from enum values',
        createElement: (): FormElement => ({
            type: 'Control',
            scope: `/properties/${uniqueKey('sel')}`,
            options: { displayAs: 'select' },
            _id: id(),
        }),
        createSchemaProperty: () => {
            const key = uniqueKey('sel');
            return {
                key,
                schema: {
                    type: 'string',
                    title: 'Select',
                    enum: ['option1', 'option2', 'option3'],
                },
            };
        },
    },
    {
        id: 'radio',
        label: 'Radio',
        icon: 'bi bi-ui-radios',
        description: 'Radio button group',
        createElement: (): FormElement => ({
            type: 'Control',
            scope: `/properties/${uniqueKey('radio')}`,
            options: { displayAs: 'radiobuttons' },
            _id: id(),
        }),
        createSchemaProperty: () => {
            const key = uniqueKey('radio');
            return {
                key,
                schema: {
                    type: 'string',
                    title: 'Radio Group',
                    enum: ['option1', 'option2'],
                },
            };
        },
    },
    {
        id: 'switches',
        label: 'Switches',
        icon: 'bi bi-toggle-on',
        description: 'Toggle switch group for enum',
        createElement: (): FormElement => ({
            type: 'Control',
            scope: `/properties/${uniqueKey('sw')}`,
            options: { displayAs: 'switches' },
            _id: id(),
        }),
        createSchemaProperty: () => {
            const key = uniqueKey('sw');
            return {
                key,
                schema: {
                    type: 'string',
                    title: 'Switches',
                    enum: ['option1', 'option2'],
                },
            };
        },
    },
    {
        id: 'enumbuttons',
        label: 'Buttons',
        icon: 'bi bi-square',
        description: 'Button group for enum selection',
        createElement: (): FormElement => ({
            type: 'Control',
            scope: `/properties/${uniqueKey('ebtn')}`,
            options: { displayAs: 'buttons' },
            _id: id(),
        }),
        createSchemaProperty: () => {
            const key = uniqueKey('ebtn');
            return {
                key,
                schema: {
                    type: 'string',
                    title: 'Button Select',
                    enum: ['option1', 'option2'],
                },
            };
        },
    },
];

// ── Data: Tags ─────────────────────────────────────────────────────────────────

const tagsFields: PaletteField[] = [
    {
        id: 'tags',
        label: 'Tags',
        icon: 'bi bi-tags',
        description: 'Free-form tag input (array of strings)',
        createElement: (): FormElement => ({
            type: 'Control',
            scope: `/properties/${uniqueKey('tags')}`,
            options: { tags: { enabled: true } } as any,
            _id: id(),
        }),
        createSchemaProperty: () => {
            const key = uniqueKey('tags');
            return {
                key,
                schema: {
                    type: 'array',
                    title: 'Tags',
                    items: { type: 'string' },
                },
            };
        },
    },
];

// ── Data: File ─────────────────────────────────────────────────────────────────

const fileFields: PaletteField[] = [
    {
        id: 'file',
        label: 'File Upload',
        icon: 'bi bi-file-earmark-arrow-up',
        description: 'File upload input',
        createElement: (): FormElement => ({
            type: 'Control',
            scope: `/properties/${uniqueKey('file')}`,
            _id: id(),
        }),
        createSchemaProperty: () => {
            const key = uniqueKey('file');
            return {
                key,
                schema: { type: 'string', format: 'uri', title: 'File Upload' },
            };
        },
    },
];

// ── Complex ────────────────────────────────────────────────────────────────────

const complexFields: PaletteField[] = [
    {
        id: 'object',
        label: 'Object',
        icon: 'bi bi-braces',
        description: 'Nested object with sub-properties',
        createElement: (): FormElement => {
            const key = uniqueKey('obj');
            return {
                type: 'Object',
                key,
                elements: [],
                properties: {},
                required: [],
                title: 'Object',
                _id: id(),
            } as any;
        },
    },
    {
        id: 'array',
        label: 'Array',
        icon: 'bi bi-list',
        description: 'Repeatable array of items',
        createElement: (): FormElement => {
            const key = uniqueKey('arr');
            return {
                type: 'Array',
                key,
                elements: [],
                items: {
                    type: 'object' as const,
                    properties: {},
                    required: [] as string[],
                },
                title: 'Array',
                _id: id(),
            } as any;
        },
    },
];

// ── Hierarchical palette sections ──────────────────────────────────────────────

export const paletteSections: PaletteSection[] = [
    {
        id: 'layouts',
        label: 'Layouts',
        icon: 'bi bi-layout',
        fields: layoutFields,
    },
    {
        id: 'misc',
        label: 'Miscellaneous',
        icon: 'bi bi-wrench',
        fields: miscFields,
    },
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
                id: 'tags',
                label: 'Tags',
                icon: 'bi bi-tags',
                fields: tagsFields,
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
        id: 'complex',
        label: 'Complex',
        icon: 'bi bi-braces',
        fields: complexFields,
    },
];

// ── Flat list for search ─────────────────────────────────────

export function getAllPaletteFields(): PaletteField[] {
    function flatten(sections: PaletteSection[]): PaletteField[] {
        return sections.flatMap((s) => [
            ...(s.fields ?? []),
            ...flatten(s.sections ?? []),
        ]);
    }
    return flatten(paletteSections);
}
