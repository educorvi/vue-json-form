import type { Meta, StoryObj } from "@storybook/vue3-vite";

const meta: Meta = {
  title: "Feedback/Message",
  tags: ["autodocs"],
  argTypes: {
    severity: {
      control: "select",
      options: ["success", "info", "warn", "error", "secondary", "contrast"],
      description: "Message severity level",
      table: { defaultValue: { summary: "info" } },
    },
    content: {
      control: "text",
      description: "Message text content",
    },
    closable: {
      control: "boolean",
      description: "Show close button",
      table: { defaultValue: { summary: "false" } },
    },
  },
  args: {
    severity: "info",
    content: "This is an informational message.",
    closable: false,
  },
  parameters: {
    docs: {
      description: {
        component:
          "PrimeVue Message banner with UV Nexus theme — inline feedback for success, info, warning, and error states.",
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
      return { args };
    },
    template: `
      <div class="p-4 max-w-lg">
        <Message :severity="args.severity" :closable="args.closable">{{ args.content }}</Message>
      </div>
    `,
  }),
};

// ── 2. Individual stories ─────────────────────────────────────────────────────
export const Success: Story = {
  name: "Success",
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="p-4 max-w-lg">
        <Message severity="success">Your changes have been saved successfully.</Message>
      </div>
    `,
  }),
};

export const Info: Story = {
  name: "Info",
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="p-4 max-w-lg">
        <Message severity="info">Your session will expire in 10 minutes.</Message>
      </div>
    `,
  }),
};

export const Warning: Story = {
  name: "Warning",
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="p-4 max-w-lg">
        <Message severity="warn">Unsaved changes will be lost if you navigate away.</Message>
      </div>
    `,
  }),
};

export const Error: Story = {
  name: "Error",
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="p-4 max-w-lg">
        <Message severity="error">Unable to connect to the server. Please try again.</Message>
      </div>
    `,
  }),
};

export const Closable: Story = {
  name: "Closable",
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="p-4 max-w-lg flex flex-col gap-3">
        <Message severity="success" :closable="true">Saved — click × to dismiss.</Message>
        <Message severity="warn" :closable="true">Review required before publishing.</Message>
      </div>
    `,
  }),
};

// ── 3. Collage ────────────────────────────────────────────────────────────────
export const Collage: Story = {
  name: "Collage – All Severities",
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-col gap-3 p-4 max-w-lg">
        <Message severity="success">Record saved successfully.</Message>
        <Message severity="info">Your session expires in 10 minutes.</Message>
        <Message severity="warn">Unsaved changes will be lost.</Message>
        <Message severity="error">Failed to connect to the server.</Message>
        <Message severity="secondary">This is a secondary message.</Message>
        <Message severity="contrast">High-contrast message for emphasis.</Message>
      </div>
    `,
  }),
};
