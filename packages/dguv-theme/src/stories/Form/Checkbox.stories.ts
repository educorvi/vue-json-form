import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";

const meta: Meta = {
  title: "Form/Checkbox",
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "Label text next to the checkbox",
      table: { category: "Content" },
    },
    disabled: {
      control: "boolean",
      description: "Disable the checkbox",
      table: { category: "State" },
    },
    invalid: {
      control: "boolean",
      description: "Mark as invalid / error state",
      table: { category: "State" },
    },
  },
  args: {
    label: "Accept terms and conditions",
    disabled: false,
    invalid: false,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Checkbox component with UV Nexus theme — binary or multi-value selection.",
      },
    },
  },
};
export default meta;
type Story = StoryObj;

// ── 1. Interactive ────────────────────────────────────────────────────────────
export const Interactive: Story = {
  name: "Interactive",
  render: (args) => ({
    setup() {
      const checked = ref(false);
      return { checked, args };
    },
    template: `
      <div class="p-4 flex items-center gap-3">
        <Checkbox v-model="checked" input-id="cb-interactive" :binary="true"
          :disabled="args.disabled" :invalid="args.invalid" />
        <label for="cb-interactive" class="cursor-pointer">{{ args.label }}</label>
      </div>
    `,
  }),
};

// ── 2. Individual stories ─────────────────────────────────────────────────────
export const Unchecked: Story = {
  name: "Unchecked",
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const checked = ref(false);
      return { checked };
    },
    template: `
      <div class="p-4 flex items-center gap-3">
        <Checkbox v-model="checked" input-id="cb1" :binary="true" />
        <label for="cb1" class="cursor-pointer">Unchecked checkbox</label>
      </div>
    `,
  }),
};

export const Checked: Story = {
  name: "Checked",
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const checked = ref(true);
      return { checked };
    },
    template: `
      <div class="p-4 flex items-center gap-3">
        <Checkbox v-model="checked" input-id="cb2" :binary="true" />
        <label for="cb2" class="cursor-pointer">Checked checkbox</label>
      </div>
    `,
  }),
};

export const Invalid: Story = {
  name: "Invalid",
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const checked = ref(false);
      return { checked };
    },
    template: `
      <div class="p-4 flex flex-col gap-2">
        <div class="flex items-center gap-3">
          <Checkbox v-model="checked" input-id="cb3" :binary="true" invalid />
          <label for="cb3" class="cursor-pointer">You must accept the terms</label>
        </div>
        <small class="text-red-500 text-sm ml-6">This field is required.</small>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  name: "Disabled",
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="p-4 flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <Checkbox :model-value="false" input-id="cb4" :binary="true" disabled />
          <label for="cb4" class="cursor-not-allowed text-surface-400">Disabled (unchecked)</label>
        </div>
        <div class="flex items-center gap-3">
          <Checkbox :model-value="true" input-id="cb5" :binary="true" disabled />
          <label for="cb5" class="cursor-not-allowed text-surface-400">Disabled (checked)</label>
        </div>
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
      const checked1 = ref(false);
      const checked2 = ref(true);
      const checked3 = ref(false);
      return { checked1, checked2, checked3 };
    },
    template: `
      <div class="flex flex-col gap-4 p-4">
        <div class="flex items-center gap-3">
          <Checkbox v-model="checked1" input-id="col1" :binary="true" />
          <label for="col1" class="cursor-pointer">Unchecked</label>
        </div>
        <div class="flex items-center gap-3">
          <Checkbox v-model="checked2" input-id="col2" :binary="true" />
          <label for="col2" class="cursor-pointer">Checked</label>
        </div>
        <div class="flex items-center gap-3">
          <Checkbox v-model="checked3" input-id="col3" :binary="true" invalid />
          <label for="col3" class="cursor-pointer">Invalid state</label>
        </div>
        <div class="flex items-center gap-3">
          <Checkbox :model-value="false" input-id="col4" :binary="true" disabled />
          <label for="col4" class="cursor-not-allowed text-surface-400">Disabled (unchecked)</label>
        </div>
        <div class="flex items-center gap-3">
          <Checkbox :model-value="true" input-id="col5" :binary="true" disabled />
          <label for="col5" class="cursor-not-allowed text-surface-400">Disabled (checked)</label>
        </div>
      </div>
    `,
  }),
};
