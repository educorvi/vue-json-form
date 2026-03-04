import type { Meta, StoryObj } from '@storybook/vue3';
import { bootstrapComponents } from '@educorvi/vue-json-form';

const meta = {
    title: 'Bootstrap Controls/NumberControl',
    component: bootstrapComponents.NumberControl,
    tags: ['autodocs'],
    argTypes: {
        modelValue: { control: 'number' },
        schema: { control: 'object' },
    },
} satisfies Meta<typeof bootstrapComponents.NumberControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        modelValue: 0,
        schema: {
            type: 'number',
            title: 'Number Input',
            description: 'A basic number input'
        },
        uiSchema: {
            type: 'Control',
            scope: '/properties/numberPath'
        },
        required: false,
        path: '/numberPath',
        errors: [],
        validParent: true,
    },
};
