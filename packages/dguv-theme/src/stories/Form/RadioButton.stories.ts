import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";

const meta: Meta = {
  title: "Form/Radio Button",
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "Label text for the radio button",
      table: { category: "Content" },
    },
    disabled: {
      control: "boolean",
      description: "Disable the radio button",
      table: { category: "State" },
    },
    invalid: {
      control: "boolean",
      description: "Mark as invalid / error state",
      table: { category: "State" },
    },
  },
  args: {
    label: "Option label",
    disabled: false,
    invalid: false,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Radio button component with UV Nexus theme — used in groups for single-choice selection.",
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
        <RadioButton v-model="checked" input-id="rb-interactive" name="interactive" :value="true"
          :disabled="args.disabled" :invalid="args.invalid" />
        <label for="rb-interactive" class="cursor-pointer">{{ args.label }}</label>
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
      const selected = ref("b");
      return { selected };
    },
    template: `
      <div class="p-4 flex items-center gap-3">
        <RadioButton v-model="selected" input-id="rb-unchecked" name="single" value="a" />
        <label for="rb-unchecked" class="cursor-pointer">Unselected option</label>
      </div>
    `,
  }),
};

export const Checked: Story = {
  name: "Checked",
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const selected = ref("a");
      return { selected };
    },
    template: `
      <div class="p-4 flex items-center gap-3">
        <RadioButton v-model="selected" input-id="rb-checked" name="single2" value="a" />
        <label for="rb-checked" class="cursor-pointer">Selected option</label>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  name: "Disabled",
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const selected = ref("a");
      return { selected };
    },
    template: `
      <div class="p-4 flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <RadioButton v-model="selected" input-id="rb-dis-on" name="dis" value="a" disabled />
          <label for="rb-dis-on" class="cursor-not-allowed text-surface-400">Disabled (selected)</label>
        </div>
        <div class="flex items-center gap-3">
          <RadioButton v-model="selected" input-id="rb-dis-off" name="dis" value="b" disabled />
          <label for="rb-dis-off" class="cursor-not-allowed text-surface-400">Disabled (unselected)</label>
        </div>
      </div>
    `,
  }),
};

export const Group: Story = {
  name: "Group",
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const priority = ref("medium");
      return { priority };
    },
    template: `
      <div class="p-4 flex flex-col gap-3">
        <label class="font-semibold text-sm mb-1">Priority</label>
        <div class="flex items-center gap-3">
          <RadioButton v-model="priority" input-id="low" name="priority" value="low" />
          <label for="low" class="cursor-pointer">Low</label>
        </div>
        <div class="flex items-center gap-3">
          <RadioButton v-model="priority" input-id="medium" name="priority" value="medium" />
          <label for="medium" class="cursor-pointer">Medium</label>
        </div>
        <div class="flex items-center gap-3">
          <RadioButton v-model="priority" input-id="high" name="priority" value="high" />
          <label for="high" class="cursor-pointer">High</label>
        </div>
        <div class="flex items-center gap-3">
          <RadioButton input-id="critical" name="priority" value="critical" disabled />
          <label for="critical" class="cursor-not-allowed text-surface-400">Critical (disabled)</label>
        </div>
        <small class="text-surface-400 mt-1">Selected: <strong>{{ priority }}</strong></small>
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
      const val1 = ref("a");
      const val2 = ref("a");
      return { val1, val2 };
    },
    template: `
      <div class="flex flex-col gap-8 p-4">
        <section>
          <p class="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-3">Horizontal group</p>
          <div class="flex gap-6">
            <div class="flex items-center gap-2">
              <RadioButton v-model="val1" input-id="h-a" name="h" value="a" />
              <label for="h-a" class="cursor-pointer">Option A</label>
            </div>
            <div class="flex items-center gap-2">
              <RadioButton v-model="val1" input-id="h-b" name="h" value="b" />
              <label for="h-b" class="cursor-pointer">Option B</label>
            </div>
            <div class="flex items-center gap-2">
              <RadioButton v-model="val1" input-id="h-c" name="h" value="c" />
              <label for="h-c" class="cursor-pointer">Option C</label>
            </div>
          </div>
        </section>
        <section>
          <p class="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-3">Vertical group with disabled</p>
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-3">
              <RadioButton v-model="val2" input-id="v-a" name="v" value="a" />
              <label for="v-a" class="cursor-pointer">Option A (checked)</label>
            </div>
            <div class="flex items-center gap-3">
              <RadioButton v-model="val2" input-id="v-b" name="v" value="b" />
              <label for="v-b" class="cursor-pointer">Option B</label>
            </div>
            <div class="flex items-center gap-3">
              <RadioButton input-id="v-c" name="v" value="c" disabled />
              <label for="v-c" class="cursor-not-allowed text-surface-400">Option C (disabled)</label>
            </div>
          </div>
        </section>
      </div>
    `,
  }),
};
