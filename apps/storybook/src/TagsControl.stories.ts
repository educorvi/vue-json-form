import type { Meta, StoryObj } from '@storybook/vue3';
import { bootstrapComponents } from '@educorvi/vue-json-form';

const meta = {
    title: 'Bootstrap Controls/TagsControl',
    component: bootstrapComponents.TagsControl,
    tags: ['autodocs'],
    argTypes: {
        modelValue: { control: 'object' },
        schema: { control: 'object' },
    },
} satisfies Meta<typeof bootstrapComponents.TagsControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        modelValue: ['tag1', 'tag2'],
        schema: {
            type: 'array',
            title: 'Tags Input',
            description: 'A basic tags input',
            items: {
                type: 'string'
            }
        },
        uiSchema: {
            type: 'Control',
            scope: '/properties/tagsPath'
        },
        required: false,
        path: '/tagsPath',
        errors: [],
        validParent: true,
    },
};
