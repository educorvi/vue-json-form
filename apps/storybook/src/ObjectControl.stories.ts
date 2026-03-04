import type { Meta, StoryObj } from '@storybook/vue3';
import { bootstrapComponents } from '@educorvi/vue-json-form';

const meta = {
    title: 'Bootstrap Controls/ObjectControl',
    component: bootstrapComponents.ObjectControl,
    tags: ['autodocs'],
    argTypes: {
        modelValue: { control: 'object' },
        schema: { control: 'object' },
    },
} satisfies Meta<typeof bootstrapComponents.ObjectControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        modelValue: {},
        schema: {
            type: 'object',
            title: 'Object Input',
            description: 'A basic object input',
            properties: {
                foo: { type: 'string', title: 'Foo' },
                bar: { type: 'number', title: 'Bar' }
            }
        },
        uiSchema: {
            type: 'Control',
            scope: '/properties/objectPath'
        },
        required: false,
        path: '/objectPath',
        errors: [],
        validParent: true,
    },
};
