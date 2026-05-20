import type { Meta, StoryObj } from "@storybook/vue3-vite";

const meta: Meta = {
  title: "Theme/Colors",
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component:
          "UV corporate brand color palette \u2014 all CSS custom properties (--uv-*) used as the single source of truth for PrimeVue primitives and Tailwind utilities.",
      },
    },
  },
};
export default meta;
type Story = StoryObj;

const SWATCHES = [
  {
    name: "Blue \u2014 Primary",
    cssPrefix: "uv-blue",
    stops: ["10", "20", "30", "50", "60", "70"],
    usage: "Primary actions, links, focus rings",
  },
  {
    name: "Grey \u2014 Neutral",
    cssPrefix: "uv-grey",
    stops: ["0", "5", "10", "20", "30", "50", "60", "70", "80", "90", "100"],
    usage: "Surfaces, borders, disabled states, text",
  },
  {
    name: "Teal \u2014 Info",
    cssPrefix: "uv-teal",
    stops: ["10", "20", "30", "50", "60", "70"],
    usage: "Informational states and badges",
  },
  {
    name: "Violet \u2014 Accent",
    cssPrefix: "uv-violet",
    stops: ["10", "20", "30", "50", "60", "70"],
    usage: "Brand accent, decorative highlights",
  },
  {
    name: "Green \u2014 Success",
    cssPrefix: "uv-green",
    stops: ["10", "20", "30", "50", "60", "70"],
    usage: "Confirmation, positive feedback",
  },
  {
    name: "Red \u2014 Error",
    cssPrefix: "uv-red",
    stops: ["10", "20", "30", "50", "60", "70"],
    usage: "Errors, destructive actions",
  },
  {
    name: "Orange \u2014 Warning",
    cssPrefix: "uv-orange",
    stops: ["10", "20", "30", "50", "60", "70"],
    usage: "Warnings, caution states",
  },
];

export const Palette: Story = {
  name: "Color Palette",
  render: () => ({
    setup() {
      return { SWATCHES };
    },
    template: `
      <div class="p-6 flex flex-col gap-10">
        <div v-for="swatch in SWATCHES" :key="swatch.name">
          <div class="mb-2">
            <span class="font-semibold text-sm">{{ swatch.name }}</span>
            <span class="text-xs text-surface-400 ml-2">{{ swatch.usage }}</span>
          </div>
          <div class="flex gap-1 flex-wrap">
            <div
              v-for="stop in swatch.stops"
              :key="stop"
              class="flex flex-col items-center gap-1.5"
            >
              <div
                class="w-14 h-14 rounded-sm border border-black/10"
                :style="{ background: 'var(--' + swatch.cssPrefix + '-' + stop + ')' }"
              ></div>
              <span class="text-xs text-surface-500 font-mono">{{ stop }}</span>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};

export const SemanticRoles: Story = {
  name: "Semantic Color Roles",
  render: () => ({
    template: `
      <div class="p-6 flex flex-col gap-4 max-w-sm">
        <p class="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-2">PrimeVue semantic surface tokens</p>
        <div v-for="role in roles" :key="role.label" class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-sm border border-black/10 flex-shrink-0"
            :style="{ background: role.value }"></div>
          <div>
            <p class="text-sm font-medium">{{ role.label }}</p>
            <p class="text-xs font-mono text-surface-400">{{ role.token }}</p>
          </div>
        </div>
      </div>
    `,
    setup() {
      const roles = [
        {
          label: "Primary Default",
          token: "var(--p-primary-color)",
          value: "var(--p-primary-color)",
        },
        {
          label: "Primary Hover",
          token: "var(--p-primary-hover-color)",
          value: "var(--p-primary-hover-color)",
        },
        {
          label: "Surface Ground",
          token: "var(--p-surface-ground)",
          value: "var(--p-surface-ground)",
        },
        {
          label: "Surface Card",
          token: "var(--p-surface-card)",
          value: "var(--p-surface-card)",
        },
        {
          label: "Surface Border",
          token: "var(--p-surface-border)",
          value: "var(--p-surface-border)",
        },
        {
          label: "Text Color",
          token: "var(--p-text-color)",
          value: "var(--p-text-color)",
        },
        {
          label: "Text Muted",
          token: "var(--p-text-muted-color)",
          value: "var(--p-text-muted-color)",
        },
      ];
      return { roles };
    },
  }),
};
