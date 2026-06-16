import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";

const meta: Meta = {
  title: "Form/Toggle Switch",
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "Label text next to the toggle",
      table: { category: "Content" },
    },
    disabled: {
      control: "boolean",
      description: "Disable the toggle switch",
      table: { category: "State" },
    },
    invalid: {
      control: "boolean",
      description: "Mark as invalid / error state",
      table: { category: "State" },
    },
  },
  args: {
    label: "Enable notifications",
    disabled: false,
    invalid: false,
  },
  parameters: {
    docs: {
      description: {
        component: "Toggle switch (on/off control) with UV Nexus theme.",
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
        <ToggleSwitch v-model="checked" input-id="ts-interactive"
          :disabled="args.disabled" :invalid="args.invalid" />
        <label for="ts-interactive" class="cursor-pointer">
          {{ args.label }} — <strong>{{ checked ? 'On' : 'Off' }}</strong>
        </label>
      </div>
    `,
  }),
};

// ── 2. Individual stories ─────────────────────────────────────────────────────
export const Off: Story = {
  name: "Off",
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const checked = ref(false);
      return { checked };
    },
    template: `
      <div class="p-4 flex items-center gap-3">
        <ToggleSwitch v-model="checked" input-id="ts-off" />
        <label for="ts-off" class="cursor-pointer">Toggle is off</label>
      </div>
    `,
  }),
};

export const On: Story = {
  name: "On",
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const checked = ref(true);
      return { checked };
    },
    template: `
      <div class="p-4 flex items-center gap-3">
        <ToggleSwitch v-model="checked" input-id="ts-on" />
        <label for="ts-on" class="cursor-pointer">Toggle is on</label>
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
          <ToggleSwitch :model-value="false" input-id="ts-dis-off" disabled />
          <label for="ts-dis-off" class="text-surface-400">Disabled (off)</label>
        </div>
        <div class="flex items-center gap-3">
          <ToggleSwitch :model-value="true" input-id="ts-dis-on" disabled />
          <label for="ts-dis-on" class="text-surface-400">Disabled (on)</label>
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
      const notifications = ref(true);
      const marketing = ref(false);
      return { notifications, marketing };
    },
    template: `
      <div class="flex flex-col gap-5 p-4">
        <div class="flex items-center justify-between max-w-xs">
          <label for="ts-notif" class="cursor-pointer text-sm font-medium">Email notifications</label>
          <ToggleSwitch v-model="notifications" input-id="ts-notif" />
        </div>
        <div class="flex items-center justify-between max-w-xs">
          <label for="ts-mkt" class="cursor-pointer text-sm font-medium">Marketing emails</label>
          <ToggleSwitch v-model="marketing" input-id="ts-mkt" />
        </div>
        <div class="flex items-center justify-between max-w-xs">
          <label for="ts-dis2" class="text-sm font-medium text-surface-400">SSO enforced (locked)</label>
          <ToggleSwitch :model-value="true" input-id="ts-dis2" disabled />
        </div>
      </div>
    `,
  }),
};
