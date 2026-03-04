import type { Meta, StoryObj } from '@storybook/vue3';
import { bootstrapComponents } from '@educorvi/vue-json-form';

const meta = {
    title: 'Bootstrap Controls/DefaultControl',
    component: bootstrapComponents.DefaultControl,
    tags: ['autodocs'],
    argTypes: {
        modelValue: { control: 'text' },
        schema: { control: 'object' },
    },
} satisfies Meta<typeof bootstrapComponents.DefaultControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        modelValue: 'Some default value',
        schema: {
            type: 'string',
            title: 'Default Control',
            description: 'Used when no specific control matches'
        },
        uiSchema: {
            type: 'Control',
            scope: '/properties/defaultPath'
        },
        required: false,
        path: '/defaultPath',
        errors: [],
        validParent: true,
    },
};
