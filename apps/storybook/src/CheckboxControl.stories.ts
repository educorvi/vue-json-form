import type { Meta, StoryObj } from '@storybook/vue3';
import { bootstrapComponents } from '@educorvi/vue-json-form';

const meta = {
    title: 'Bootstrap Controls/CheckboxControl',
    component: bootstrapComponents.CheckboxControl,
    tags: ['autodocs'],
    argTypes: {
        modelValue: { control: 'boolean' },
        schema: { control: 'object' },
    },
} satisfies Meta<typeof bootstrapComponents.CheckboxControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        modelValue: false,
        schema: {
            type: 'boolean',
            title: 'Boolean Checkbox',
            description: 'A basic boolean checkbox check'
        },
        uiSchema: {
            type: 'Control',
            scope: '/properties/checkboxPath'
        },
        required: false,
        path: '/checkboxPath',
        errors: [],
        validParent: true,
    },
};
