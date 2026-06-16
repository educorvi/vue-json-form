import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed } from "vue";

const meta: Meta = {
  title: "Tags & Chips/Chip",
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "Chip label text",
      table: { category: "Content" },
    },
    icon: {
      control: "text",
      description: "PrimeIcons class (e.g. pi pi-user)",
      table: { category: "Content" },
    },
    removable: {
      control: "boolean",
      description: "Show remove button",
      table: { category: "Behavior" },
    },
  },
  args: {
    label: "Chip label",
    icon: "",
    removable: false,
  },
  parameters: {
    docs: {
      description: {
        component:
          "PrimeVue Chip with UV Nexus theme — used for tags, filters, and compact labels.",
      },
    },
  },
};
export default meta;
type Story = StoryObj;

function toChipProps(args: Record<string, any>) {
  return { ...args, icon: args.icon || undefined };
}

// ── 1. Interactive ────────────────────────────────────────────────────────────
export const Interactive: Story = {
  name: "Interactive",
  render: (args) => ({
    setup() {
      const props = computed(() => toChipProps(args));
      return { props };
    },
    template: `<div class="p-4"><Chip v-bind="props" /></div>`,
  }),
};

// ── 2. Individual stories ─────────────────────────────────────────────────────
export const Default: Story = {
  name: "Default",
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap gap-3 p-4">
        <Chip label="UV Design System" />
        <Chip label="PrimeVue" />
        <Chip label="Tailwind v4" />
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
        <Chip label="User" icon="pi pi-user" />
        <Chip label="Settings" icon="pi pi-cog" />
        <Chip label="Verified" icon="pi pi-check-circle" />
      </div>
    `,
  }),
};

export const Removable: Story = {
  name: "Removable",
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap gap-3 p-4">
        <Chip label="Vue.js" removable />
        <Chip label="TypeScript" removable />
        <Chip label="Storybook" removable />
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
      <div class="flex flex-col gap-6 p-4">
        <section>
          <p class="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-3">Default</p>
          <div class="flex flex-wrap gap-3">
            <Chip label="UV Design System" />
            <Chip label="PrimeVue 4" />
            <Chip label="Vue 3" />
          </div>
        </section>
        <section>
          <p class="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-3">With Icons</p>
          <div class="flex flex-wrap gap-3">
            <Chip label="User" icon="pi pi-user" />
            <Chip label="Settings" icon="pi pi-cog" />
            <Chip label="Notifications" icon="pi pi-bell" />
          </div>
        </section>
        <section>
          <p class="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-3">Removable</p>
          <div class="flex flex-wrap gap-3">
            <Chip label="Vue.js" removable />
            <Chip label="TypeScript" removable />
            <Chip label="Tailwind" removable />
          </div>
        </section>
      </div>
    `,
  }),
};
