import type { Meta, StoryObj } from '@storybook/vue3';
import { bootstrapComponents } from '@educorvi/vue-json-form';

const meta = {
    title: 'Bootstrap Controls/FileControl',
    component: bootstrapComponents.FileControl,
    tags: ['autodocs'],
    argTypes: {
        modelValue: { control: 'text' },
        schema: { control: 'object' },
    },
} satisfies Meta<typeof bootstrapComponents.FileControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        modelValue: '',
        schema: {
            type: 'string',
            title: 'File Input',
            description: 'A basic file input',
            format: 'data-url'
        },
        uiSchema: {
            type: 'Control',
            scope: '/properties/filePath'
        },
        required: false,
        path: '/filePath',
        errors: [],
        validParent: true,
    },
};
