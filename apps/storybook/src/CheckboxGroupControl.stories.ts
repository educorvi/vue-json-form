import type { Meta, StoryObj } from '@storybook/vue3';
import { bootstrapComponents } from '@educorvi/vue-json-form';

const meta = {
    title: 'Bootstrap Controls/CheckboxGroupControl',
    component: bootstrapComponents.CheckboxGroupControl,
    tags: ['autodocs'],
    argTypes: {
        modelValue: { control: 'object' },
        schema: { control: 'object' },
    },
} satisfies Meta<typeof bootstrapComponents.CheckboxGroupControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        modelValue: ['option1'],
        schema: {
            type: 'array',
            title: 'Checkbox Group',
            description: 'A checkbox group input',
            items: {
                type: 'string',
                enum: ['option1', 'option2', 'option3']
            },
            uniqueItems: true
        },
        uiSchema: {
            type: 'Control',
            scope: '/properties/checkboxGroupPath'
        },
        required: false,
        path: '/checkboxGroupPath',
        errors: [],
        validParent: true,
    },
};
