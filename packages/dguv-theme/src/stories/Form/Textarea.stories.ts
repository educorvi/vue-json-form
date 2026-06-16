import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref, computed } from "vue";

const meta: Meta = {
  title: "Form/Textarea",
  tags: ["autodocs"],
  argTypes: {
    placeholder: {
      control: "text",
      description: "Placeholder text when empty",
      table: { category: "Content" },
    },
    rows: {
      control: "number",
      description: "Number of visible text rows",
      table: { category: "Appearance", defaultValue: { summary: "5" } },
    },
    autoResize: {
      control: "boolean",
      description: "Auto-grow height as content expands",
      table: { category: "Appearance" },
    },
    disabled: {
      control: "boolean",
      description: "Disable the textarea",
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
    placeholder: "Enter your message…",
    rows: 4,
    autoResize: false,
    disabled: false,
    invalid: false,
    fluid: false,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Multi-line text area with UV Nexus theme — matches InputText styling.",
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
      return { value, args };
    },
    template: `
      <div class="p-4 max-w-sm">
        <Textarea v-model="value" v-bind="args" />
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
        <Textarea v-model="value" placeholder="Enter your message…" rows="4" />
      </div>
    `,
  }),
};

export const AutoResize: Story = {
  name: "Auto-resize",
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const value = ref("");
      return { value };
    },
    template: `
      <div class="p-4 max-w-sm flex flex-col gap-1">
        <Textarea v-model="value" placeholder="Start typing — I grow with content…" :auto-resize="true" rows="3" />
        <small class="text-surface-400 text-xs">Grows as you type</small>
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
        <Textarea placeholder="Required field…" invalid rows="3" />
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
        <Textarea value="This content cannot be edited." disabled rows="3" />
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
          <Textarea v-model="value" placeholder="Enter your message…" rows="3" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">Auto-resize</label>
          <Textarea placeholder="Grows as you type…" :auto-resize="true" rows="2" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">Invalid</label>
          <Textarea placeholder="Required field…" invalid rows="2" />
          <small class="text-red-500">This field is required.</small>
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm text-surface-400">Disabled</label>
          <Textarea value="Read-only content." disabled rows="2" />
        </div>
      </div>
    `,
  }),
};
