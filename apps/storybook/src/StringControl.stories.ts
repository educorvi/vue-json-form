import type { Meta, StoryObj } from '@storybook/vue3';
import { bootstrapComponents } from '@educorvi/vue-json-form';

const meta = {
    title: 'Bootstrap Controls/StringControl',
    component: bootstrapComponents.StringControl,
    tags: ['autodocs'],
    argTypes: {
        modelValue: { control: 'text' },
        schema: { control: 'object' },
    },
} satisfies Meta<typeof bootstrapComponents.StringControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        modelValue: 'Initial String',
        schema: {
            type: 'string',
            title: 'String Input',
            description: 'A basic string input'
        },
        uiSchema: {
            type: 'Control',
            scope: '/properties/stringPath'
        },
        required: false,
        path: '/stringPath',
        errors: [],
        validParent: true,
    },
};
