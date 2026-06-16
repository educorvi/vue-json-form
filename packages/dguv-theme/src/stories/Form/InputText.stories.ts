import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref, computed } from "vue";

const meta: Meta = {
  title: "Form/Input Text",
  tags: ["autodocs"],
  argTypes: {
    placeholder: {
      control: "text",
      description: "Placeholder text when empty",
      table: { category: "Content" },
    },
    size: {
      control: "select",
      options: ["small", "normal", "large"],
      description: "Input size",
      table: { category: "Appearance", defaultValue: { summary: "normal" } },
    },
    disabled: {
      control: "boolean",
      description: "Disable the input",
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
    placeholder: "Enter text…",
    size: "normal",
    disabled: false,
    invalid: false,
    fluid: false,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Text input field with UV Nexus theme — 1 px rounded corners, neutral border, primary hover/focus ring.",
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
      const value = ref("");
      const props = computed(() => ({
        ...args,
        size: args.size === "normal" ? undefined : args.size,
      }));
      return { value, props };
    },
    template: `
      <div class="p-4 max-w-sm">
        <InputText v-model="value" v-bind="props" />
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
      const value = ref("");
      return { value };
    },
    template: `
      <div class="p-4 max-w-sm">
        <InputText v-model="value" placeholder="Enter text…" />
      </div>
    `,
  }),
};

export const WithValue: Story = {
  name: "With Value",
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="p-4 max-w-sm">
        <InputText value="Pre-filled value" />
      </div>
    `,
  }),
};

export const Invalid: Story = {
  name: "Invalid",
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="p-4 max-w-sm flex flex-col gap-1">
        <InputText placeholder="Invalid input" invalid />
        <small class="text-red-500 text-sm">This field is required.</small>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  name: "Disabled",
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="p-4 max-w-sm">
        <InputText value="Disabled value" disabled />
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
      const value = ref("");
      return { value };
    },
    template: `
      <div class="flex flex-col gap-5 p-4 max-w-sm">
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">Default</label>
          <InputText v-model="value" placeholder="Enter text…" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">With value</label>
          <InputText value="Pre-filled value" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">Invalid</label>
          <InputText placeholder="Invalid input" invalid />
          <small class="text-red-500">This field is required.</small>
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm text-surface-400">Disabled</label>
          <InputText value="Disabled value" disabled />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">Small</label>
          <InputText placeholder="Small input" size="small" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">Large</label>
          <InputText placeholder="Large input" size="large" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">Fluid (full-width)</label>
          <InputText placeholder="Full-width input" fluid />
        </div>
      </div>
    `,
  }),
};
