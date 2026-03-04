import type { Meta, StoryObj } from '@storybook/vue3';
import { bootstrapComponents } from '@educorvi/vue-json-form';

const meta = {
    title: 'Bootstrap Controls/SelectControl',
    component: bootstrapComponents.SelectControl,
    tags: ['autodocs'],
    argTypes: {
        modelValue: { control: 'text' },
        schema: { control: 'object' },
    },
} satisfies Meta<typeof bootstrapComponents.SelectControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        modelValue: 'option1',
        schema: {
            type: 'string',
            title: 'Select Input',
            description: 'A basic select input',
            enum: ['option1', 'option2', 'option3']
        },
        uiSchema: {
            type: 'Control',
            scope: '/properties/selectPath'
        },
        required: false,
        path: '/selectPath',
        errors: [],
        validParent: true,
    },
};
