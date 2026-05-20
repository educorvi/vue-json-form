import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";

const meta: Meta = {
  title: "Form/Select",
  tags: ["autodocs"],
  argTypes: {
    placeholder: {
      control: "text",
      description: "Placeholder text when no option is selected",
      table: { category: "Content" },
    },
    disabled: {
      control: "boolean",
      description: "Disable the dropdown",
      table: { category: "State" },
    },
    invalid: {
      control: "boolean",
      description: "Mark as invalid / error state",
      table: { category: "State" },
    },
    fluid: {
      control: "boolean",
      description: "Stretch to full container width",
      table: { category: "Appearance" },
    },
  },
  args: {
    placeholder: "Select an option",
    disabled: false,
    invalid: false,
    fluid: false,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Dropdown/Select component with UV Nexus theme — same height and border style as InputText.",
      },
    },
  },
};
export default meta;
type Story = StoryObj;

const OPTIONS = [
  { label: "Option A", value: "a" },
  { label: "Option B", value: "b" },
  { label: "Option C", value: "c" },
];

// ── 1. Interactive ────────────────────────────────────────────────────────────
export const Interactive: Story = {
  name: "Interactive",
  render: (args) => ({
    setup() {
      const selected = ref(null);
      return { selected, args, OPTIONS };
    },
    template: `
      <div class="p-4 max-w-sm">
        <Select
          v-model="selected"
          :options="OPTIONS"
          option-label="label"
          v-bind="args"
        />
      </div>
    `,
  }),
};

// ── 2. Individual stories ─────────────────────────────────────────────────────
export const Default: Story = {
  name: "Default",
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const selected = ref(null);
      return { selected, OPTIONS };
    },
    template: `
      <div class="p-4 max-w-sm">
        <Select v-model="selected" :options="OPTIONS" option-label="label" placeholder="Select an option" />
      </div>
    `,
  }),
};

export const WithValue: Story = {
  name: "With Selected Value",
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const selected = ref("b");
      return { selected, OPTIONS };
    },
    template: `
      <div class="p-4 max-w-sm">
        <Select v-model="selected" :options="OPTIONS" option-label="label" option-value="value" placeholder="Select an option" />
      </div>
    `,
  }),
};

export const Invalid: Story = {
  name: "Invalid",
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      return { OPTIONS };
    },
    template: `
      <div class="p-4 max-w-sm flex flex-col gap-1">
        <Select :options="OPTIONS" option-label="label" placeholder="Select an option" invalid />
        <small class="text-red-500 text-sm">Please select a value.</small>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  name: "Disabled",
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      return { OPTIONS };
    },
    template: `
      <div class="p-4 max-w-sm">
        <Select :options="OPTIONS" option-label="label" placeholder="Disabled dropdown" disabled />
      </div>
    `,
  }),
};

// ── 3. Collage ────────────────────────────────────────────────────────────────
export const Collage: Story = {
  name: "Collage – All States",
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const selected = ref(null);
      return { selected, OPTIONS };
    },
    template: `
      <div class="flex flex-col gap-5 p-4 max-w-sm">
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">Default</label>
          <Select v-model="selected" :options="OPTIONS" option-label="label" placeholder="Select an option" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">Invalid</label>
          <Select :options="OPTIONS" option-label="label" placeholder="Select an option" invalid />
          <small class="text-red-500">Please select a value.</small>
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm text-surface-400">Disabled</label>
          <Select :options="OPTIONS" option-label="label" placeholder="Disabled" disabled />
        </div>
      </div>
    `,
  }),
};
