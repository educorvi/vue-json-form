import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed } from "vue";

const meta: Meta = {
  title: "Tags & Chips/Tag",
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: "text",
      description: "Tag label text",
      table: { category: "Content" },
    },
    icon: {
      control: "boolean",
      description: "Show an icon (displays pi pi-tag)",
      table: { category: "Content" },
    },
    severity: {
      control: "select",
      options: [
        "primary",
        "secondary",
        "success",
        "info",
        "warn",
        "danger",
        "contrast",
      ],
      description: "Color severity",
      table: { category: "Appearance", defaultValue: { summary: "primary" } },
    },
  },
  args: {
    value: "Tag",
    severity: "primary",
    icon: false,
  },
  parameters: {
    docs: {
      description: {
        component:
          "PrimeVue Tag with UV Nexus theme — sys-border-radius-m (4 px) corners.",
      },
    },
  },
};
export default meta;
type Story = StoryObj;

function toTagProps(args: Record<string, any>) {
  return { ...args, icon: args.icon ? "pi pi-tag" : undefined };
}

// ── 1. Interactive ───────────────────────────────────────────────────────────
export const Interactive: Story = {
  name: "Interactive",
  render: (args) => ({
    setup() {
      const props = computed(() => toTagProps(args));
      return { props };
    },
    template: `<div class="p-4"><Tag v-bind="props" /></div>`,
  }),
};

// ── 2. Individual stories ─────────────────────────────────────────────────────
export const Default: Story = {
  name: "Default",
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap gap-3 p-4">
        <Tag value="Primary" />
        <Tag value="Secondary" severity="secondary" />
        <Tag value="Success" severity="success" />
        <Tag value="Info" severity="info" />
        <Tag value="Warn" severity="warn" />
        <Tag value="Danger" severity="danger" />
        <Tag value="Contrast" severity="contrast" />
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
        <Tag value="New" icon="pi pi-plus" />
        <Tag value="Confirmed" severity="success" icon="pi pi-check" />
        <Tag value="Failed" severity="danger" icon="pi pi-times" />
        <Tag value="Pending" severity="warn" icon="pi pi-clock" />
        <Tag value="Info" severity="info" icon="pi pi-info-circle" />
      </div>
    `,
  }),
};

// ── 3. Collage ───────────────────────────────────────────────────────────────
export const Collage: Story = {
  name: "Collage – All Variants",
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-col gap-8 p-4">
        <section>
          <p class="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-3">Severities</p>
          <div class="flex flex-wrap gap-3">
            <Tag value="Primary" />
            <Tag value="Secondary" severity="secondary" />
            <Tag value="Success" severity="success" />
            <Tag value="Info" severity="info" />
            <Tag value="Warn" severity="warn" />
            <Tag value="Danger" severity="danger" />
            <Tag value="Contrast" severity="contrast" />
          </div>
        </section>
        <section>
          <p class="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-3">With Icons</p>
          <div class="flex flex-wrap gap-3">
            <Tag value="New" icon="pi pi-plus" />
            <Tag value="Confirmed" severity="success" icon="pi pi-check" />
            <Tag value="Failed" severity="danger" icon="pi pi-times" />
            <Tag value="Pending" severity="warn" icon="pi pi-clock" />
          </div>
        </section>
      </div>
    `,
  }),
};
