import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed } from "vue";
import { useToast } from "primevue/usetoast";

const meta: Meta = {
  title: "Feedback/Toast",
  tags: ["autodocs"],
  argTypes: {
    severity: {
      control: "select",
      options: ["success", "info", "warn", "error"],
      description: "Toast severity level",
      table: { defaultValue: { summary: "success" } },
    },
    summary: {
      control: "text",
      description: "Toast title / summary",
    },
    detail: {
      control: "text",
      description: "Toast body message",
    },
    life: {
      control: "number",
      description: "Auto-dismiss delay in ms (0 = sticky)",
      table: { defaultValue: { summary: "4000" } },
    },
  },
  args: {
    severity: "success",
    summary: "Success",
    detail: "Operation completed successfully.",
    life: 4000,
  },
  parameters: {
    docs: {
      description: {
        component:
          "PrimeVue Toast notification with UV Nexus theme — triggered imperatively via ToastService.",
      },
    },
  },
};
export default meta;
type Story = StoryObj;

// ── 1. Interactive ───────────────────────────────────────────────────────────
export const Interactive: Story = {
  name: "Interactive",
  render: (args) => ({
    setup() {
      const toast = useToast();
      const show = () =>
        toast.add({
          severity: args.severity as any,
          summary: args.summary as string,
          detail: args.detail as string,
          life: args.life as number,
        });
      return { show };
    },
    template: `
      <div class="p-4">
        <Button label="Show Toast" icon="pi pi-bell" @click="show" />
      </div>
    `,
  }),
};

// ── 2. Individual stories ─────────────────────────────────────────────────────
export const Success: Story = {
  name: "Success",
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const toast = useToast();
      const show = () =>
        toast.add({
          severity: "success",
          summary: "Saved",
          detail: "Your changes have been saved.",
          life: 4000,
        });
      return { show };
    },
    template: `<div class="p-4"><Button label="Show Success Toast" severity="success" icon="pi pi-check" @click="show" /></div>`,
  }),
};

export const Info: Story = {
  name: "Info",
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const toast = useToast();
      const show = () =>
        toast.add({
          severity: "info",
          summary: "Information",
          detail: "Your session will expire in 10 minutes.",
          life: 4000,
        });
      return { show };
    },
    template: `<div class="p-4"><Button label="Show Info Toast" severity="info" icon="pi pi-info-circle" @click="show" /></div>`,
  }),
};

export const Warning: Story = {
  name: "Warning",
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const toast = useToast();
      const show = () =>
        toast.add({
          severity: "warn",
          summary: "Warning",
          detail: "Unsaved changes will be lost.",
          life: 4000,
        });
      return { show };
    },
    template: `<div class="p-4"><Button label="Show Warning Toast" severity="warn" icon="pi pi-exclamation-triangle" @click="show" /></div>`,
  }),
};

export const Error: Story = {
  name: "Error",
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const toast = useToast();
      const show = () =>
        toast.add({
          severity: "error",
          summary: "Error",
          detail: "Failed to connect to the server.",
          life: 0,
        });
      return { show };
    },
    template: `<div class="p-4"><Button label="Show Error Toast" severity="danger" icon="pi pi-times-circle" @click="show" /></div>`,
  }),
};

// ── 3. Collage ───────────────────────────────────────────────────────────────
export const Collage: Story = {
  name: "Collage – All Severities",
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const toast = useToast();
      const showAll = () => {
        toast.add({
          severity: "success",
          summary: "Success",
          detail: "Record saved.",
          life: 5000,
        });
        toast.add({
          severity: "info",
          summary: "Info",
          detail: "Session expires soon.",
          life: 5000,
        });
        toast.add({
          severity: "warn",
          summary: "Warning",
          detail: "Unsaved changes.",
          life: 5000,
        });
        toast.add({
          severity: "error",
          summary: "Error",
          detail: "Connection failed.",
          life: 5000,
        });
      };
      return { showAll };
    },
    template: `
      <div class="p-4">
        <p class="text-sm text-surface-500 mb-4">Click to trigger all four toast severities at once:</p>
        <div class="flex flex-wrap gap-3">
          <Button label="Show All" icon="pi pi-th-large" @click="showAll" />
        </div>
      </div>
    `,
  }),
};
