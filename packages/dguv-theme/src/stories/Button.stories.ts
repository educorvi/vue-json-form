import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed } from "vue";

const meta: Meta = {
  title: "Components/Button",
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "Button label text",
      table: { category: "Content" },
    },
    icon: {
      control: "boolean",
      description: "Show an icon (displays pi pi-send)",
      table: { category: "Content" },
    },
    iconPos: {
      control: "select",
      options: ["left", "right"],
      description: "Icon position relative to label",
      table: { category: "Content", defaultValue: { summary: "left" } },
    },
    severity: {
      control: "select",
      options: [
        "primary",
        "secondary",
        "info",
        "success",
        "warn",
        "help",
        "danger",
        "contrast",
      ],
      description: "Color severity",
      table: { category: "Appearance", defaultValue: { summary: "primary" } },
    },
    variant: {
      control: "select",
      options: ["contained", "outlined", "text", "link"],
      description: "Visual variant",
      table: { category: "Appearance", defaultValue: { summary: "contained" } },
    },
    size: {
      control: "select",
      options: ["small", "normal", "large"],
      description: "Button size",
      table: { category: "Appearance", defaultValue: { summary: "normal" } },
    },
    disabled: {
      control: "boolean",
      description: "Disable the button",
      table: { category: "State" },
    },
    loading: {
      control: "boolean",
      description: "Show loading spinner",
      table: { category: "State" },
    },
  },
  args: {
    label: "Button",
    severity: "primary",
    variant: "contained",
    size: "normal",
    disabled: false,
    loading: false,
    icon: false,
    iconPos: "left",
  },
  parameters: {
    docs: {
      description: {
        component:
          "PrimeVue Button styled with UV Nexus theme — flat corners (border-radius: 0), semibold label, UV blue primary palette.",
      },
    },
  },
};
export default meta;
type Story = StoryObj;

function toButtonProps(args: Record<string, any>) {
  return {
    ...args,
    variant: args.variant === "contained" ? undefined : args.variant,
    size: args.size === "normal" ? undefined : args.size,
    icon: args.icon ? "pi pi-send" : undefined,
  };
}

// ── 1. Interactive ────────────────────────────────────────────────────────────
export const Interactive: Story = {
  name: "Interactive",
  render: (args) => ({
    setup() {
      const props = computed(() => toButtonProps(args));
      return { props };
    },
    template: `<div class="p-4"><Button v-bind="props" /></div>`,
  }),
};

// ── 2. Individual stories ─────────────────────────────────────────────────────
export const Contained: Story = {
  name: "Contained",
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap gap-3 p-4">
        <Button label="Primary" />
        <Button label="Secondary" severity="secondary" />
        <Button label="Success" severity="success" />
        <Button label="Info" severity="info" />
        <Button label="Warn" severity="warn" />
        <Button label="Help" severity="help" />
        <Button label="Danger" severity="danger" />
        <Button label="Contrast" severity="contrast" />
      </div>
    `,
  }),
};

export const Outlined: Story = {
  name: "Outlined",
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap gap-3 p-4">
        <Button label="Primary" variant="outlined" />
        <Button label="Secondary" severity="secondary" variant="outlined" />
        <Button label="Success" severity="success" variant="outlined" />
        <Button label="Info" severity="info" variant="outlined" />
        <Button label="Warn" severity="warn" variant="outlined" />
        <Button label="Help" severity="help" variant="outlined" />
        <Button label="Danger" severity="danger" variant="outlined" />
        <Button label="Contrast" severity="contrast" variant="outlined" />
      </div>
    `,
  }),
};

export const TextVariant: Story = {
  name: "Text",
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap gap-3 p-4">
        <Button label="Primary" variant="text" />
        <Button label="Secondary" severity="secondary" variant="text" />
        <Button label="Success" severity="success" variant="text" />
        <Button label="Info" severity="info" variant="text" />
        <Button label="Warn" severity="warn" variant="text" />
        <Button label="Help" severity="help" variant="text" />
        <Button label="Danger" severity="danger" variant="text" />
        <Button label="Contrast" severity="contrast" variant="text" />
      </div>
    `,
  }),
};

export const WithIcon: Story = {
  name: "With Icon",
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap gap-3 p-4">
        <Button label="Save" icon="pi pi-save" />
        <Button label="Delete" icon="pi pi-trash" severity="danger" />
        <Button label="Next" icon="pi pi-arrow-right" icon-pos="right" />
        <Button label="Download" icon="pi pi-download" severity="secondary" variant="outlined" />
      </div>
    `,
  }),
};

export const IconOnly: Story = {
  name: "Icon Only",
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap gap-3 p-4">
        <Button icon="pi pi-plus" aria-label="Add" />
        <Button icon="pi pi-pencil" aria-label="Edit" severity="secondary" />
        <Button icon="pi pi-trash" aria-label="Delete" severity="danger" />
        <Button icon="pi pi-search" aria-label="Search" variant="outlined" />
        <Button icon="pi pi-times" aria-label="Close" variant="text" />
      </div>
    `,
  }),
};

export const Sizes: Story = {
  name: "Sizes",
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-4 p-4">
        <Button label="Small" size="small" />
        <Button label="Default" />
        <Button label="Large" size="large" />
      </div>
    `,
  }),
};

export const Loading: Story = {
  name: "Loading",
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap gap-3 p-4">
        <Button label="Saving…" :loading="true" />
        <Button label="Processing…" :loading="true" severity="secondary" />
        <Button label="Uploading…" :loading="true" variant="outlined" />
      </div>
    `,
  }),
};

export const Disabled: Story = {
  name: "Disabled",
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap gap-3 p-4">
        <Button label="Disabled" disabled />
        <Button label="Outlined" variant="outlined" disabled />
        <Button label="Text" variant="text" disabled />
        <Button icon="pi pi-save" label="With Icon" disabled />
      </div>
    `,
  }),
};

// ── 3. Collage ────────────────────────────────────────────────────────────────
export const Collage: Story = {
  name: "Collage – All Variants",
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-col gap-8 p-6">
        <section>
          <p class="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-3">Contained</p>
          <div class="flex flex-wrap gap-3">
            <Button label="Primary" />
            <Button label="Secondary" severity="secondary" />
            <Button label="Success" severity="success" />
            <Button label="Info" severity="info" />
            <Button label="Warn" severity="warn" />
            <Button label="Help" severity="help" />
            <Button label="Danger" severity="danger" />
            <Button label="Contrast" severity="contrast" />
          </div>
        </section>
        <section>
          <p class="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-3">Outlined</p>
          <div class="flex flex-wrap gap-3">
            <Button label="Primary" variant="outlined" />
            <Button label="Secondary" severity="secondary" variant="outlined" />
            <Button label="Success" severity="success" variant="outlined" />
            <Button label="Info" severity="info" variant="outlined" />
            <Button label="Warn" severity="warn" variant="outlined" />
            <Button label="Help" severity="help" variant="outlined" />
            <Button label="Danger" severity="danger" variant="outlined" />
            <Button label="Contrast" severity="contrast" variant="outlined" />
          </div>
        </section>
        <section>
          <p class="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-3">Text</p>
          <div class="flex flex-wrap gap-3">
            <Button label="Primary" variant="text" />
            <Button label="Secondary" severity="secondary" variant="text" />
            <Button label="Success" severity="success" variant="text" />
            <Button label="Info" severity="info" variant="text" />
            <Button label="Warn" severity="warn" variant="text" />
            <Button label="Help" severity="help" variant="text" />
            <Button label="Danger" severity="danger" variant="text" />
            <Button label="Contrast" severity="contrast" variant="text" />
          </div>
        </section>
        <section>
          <p class="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-3">Sizes</p>
          <div class="flex flex-wrap items-center gap-3">
            <Button label="Small" size="small" />
            <Button label="Default" />
            <Button label="Large" size="large" />
          </div>
        </section>
        <section>
          <p class="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-3">Icons</p>
          <div class="flex flex-wrap gap-3">
            <Button label="Save" icon="pi pi-save" />
            <Button label="Delete" icon="pi pi-trash" severity="danger" />
            <Button icon="pi pi-plus" aria-label="Add" />
            <Button label="Next" icon="pi pi-arrow-right" icon-pos="right" />
          </div>
        </section>
        <section>
          <p class="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-3">States</p>
          <div class="flex flex-wrap gap-3">
            <Button label="Loading…" :loading="true" />
            <Button label="Disabled" disabled />
            <Button label="Disabled Outlined" variant="outlined" disabled />
          </div>
        </section>
      </div>
    `,
  }),
};
