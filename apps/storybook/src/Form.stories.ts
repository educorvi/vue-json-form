import type { Meta, StoryObj } from '@storybook/vue3';
import { VueJsonForm } from '@educorvi/vue-json-form';

const meta = {
    title: 'Form/VueJsonForm',
    component: VueJsonForm,
    tags: ['autodocs'],
    argTypes: {
        modelValue: { control: 'object' },
        schema: { control: 'object' },
        uiSchema: { control: 'object' },
    },
} satisfies Meta<typeof VueJsonForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        modelValue: {},
        schema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    title: 'Name'
                },
                age: {
                    type: 'number',
                    title: 'Age'
                }
            }
        },
        uiSchema: {
            version: '1.0',
            layout: {
                type: 'VerticalLayout',
                elements: [
                    { type: 'Control', scope: '/properties/name' },
                    { type: 'Control', scope: '/properties/age' }
                ]
            }
        },
    },
};
