import type { Meta, StoryObj } from '@storybook/vue3';
import { bootstrapComponents } from '@educorvi/vue-json-form';

const meta = {
    title: 'Bootstrap Controls/RadiobuttonControl',
    component: bootstrapComponents.RadiobuttonControl,
    tags: ['autodocs'],
    argTypes: {
        modelValue: { control: 'text' },
        schema: { control: 'object' },
    },
} satisfies Meta<typeof bootstrapComponents.RadiobuttonControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        modelValue: 'option1',
        schema: {
            type: 'string',
            title: 'Radio Input',
            description: 'A basic radio input',
            enum: ['option1', 'option2', 'option3']
        },
        uiSchema: {
            type: 'Control',
            scope: '/properties/radioPath',
            options: {
                displayAs: 'radiobuttons'
            }
        },
        required: false,
        path: '/radioPath',
        errors: [],
        validParent: true,
    },
};
