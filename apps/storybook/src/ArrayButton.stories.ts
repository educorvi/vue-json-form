import type { Meta, StoryObj } from '@storybook/vue3';
import { bootstrapComponents } from '@educorvi/vue-json-form';

const meta = {
    title: 'Bootstrap Controls/ArrayButton',
    component: bootstrapComponents.ArrayButton,
    tags: ['autodocs'],
    argTypes: {
        title: { control: 'text' },
        disabled: { control: 'boolean' }
    },
} satisfies Meta<typeof bootstrapComponents.ArrayButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        title: 'Add Item',
        disabled: false,
    },
};
