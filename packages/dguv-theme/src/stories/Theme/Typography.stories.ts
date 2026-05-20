import type { Meta, StoryObj } from "@storybook/vue3-vite";

const meta: Meta = {
  title: "Theme/Typography",
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component:
          "UV Nexus typography scale \u2014 Source Sans 3 as the primary typeface with a structured heading hierarchy and text utilities.",
      },
    },
  },
};
export default meta;
type Story = StoryObj;

export const Headings: Story = {
  name: "Headings",
  render: () => ({
    template: `
      <div class="p-6 flex flex-col gap-6">
        <div class="flex items-baseline gap-4 border-b border-surface-200 pb-4">
          <h1 class="text-5xl font-bold leading-tight flex-1">Heading 1 — 3rem / 48px</h1>
          <span class="text-xs font-mono text-surface-400 flex-shrink-0">text-5xl · font-bold</span>
        </div>
        <div class="flex items-baseline gap-4 border-b border-surface-200 pb-4">
          <h2 class="text-4xl font-bold leading-tight flex-1">Heading 2 — 2.25rem / 36px</h2>
          <span class="text-xs font-mono text-surface-400 flex-shrink-0">text-4xl · font-bold</span>
        </div>
        <div class="flex items-baseline gap-4 border-b border-surface-200 pb-4">
          <h3 class="text-3xl font-semibold leading-snug flex-1">Heading 3 — 1.875rem / 30px</h3>
          <span class="text-xs font-mono text-surface-400 flex-shrink-0">text-3xl · font-semibold</span>
        </div>
        <div class="flex items-baseline gap-4 border-b border-surface-200 pb-4">
          <h4 class="text-2xl font-semibold leading-snug flex-1">Heading 4 — 1.5rem / 24px</h4>
          <span class="text-xs font-mono text-surface-400 flex-shrink-0">text-2xl · font-semibold</span>
        </div>
        <div class="flex items-baseline gap-4 border-b border-surface-200 pb-4">
          <h5 class="text-xl font-semibold leading-normal flex-1">Heading 5 — 1.25rem / 20px</h5>
          <span class="text-xs font-mono text-surface-400 flex-shrink-0">text-xl · font-semibold</span>
        </div>
        <div class="flex items-baseline gap-4">
          <h6 class="text-base font-semibold leading-normal flex-1">Heading 6 — 1rem / 16px</h6>
          <span class="text-xs font-mono text-surface-400 flex-shrink-0">text-base · font-semibold</span>
        </div>
      </div>
    `,
  }),
};

export const BodyText: Story = {
  name: "Body Text",
  render: () => ({
    template: `
      <div class="p-6 flex flex-col gap-6 max-w-2xl">
        <div class="flex flex-col gap-1 border-b border-surface-200 pb-4">
          <span class="text-xs font-mono text-surface-400">text-xl — Large body</span>
          <p class="text-xl leading-relaxed">The UV Nexus design system provides consistent, accessible components for enterprise applications built on PrimeVue and Tailwind.</p>
        </div>
        <div class="flex flex-col gap-1 border-b border-surface-200 pb-4">
          <span class="text-xs font-mono text-surface-400">text-base — Default body (16px)</span>
          <p class="text-base leading-relaxed">The UV Nexus design system provides consistent, accessible components for enterprise applications built on PrimeVue and Tailwind.</p>
        </div>
        <div class="flex flex-col gap-1 border-b border-surface-200 pb-4">
          <span class="text-xs font-mono text-surface-400">text-sm — Small body (14px)</span>
          <p class="text-sm leading-relaxed">The UV Nexus design system provides consistent, accessible components for enterprise applications built on PrimeVue and Tailwind.</p>
        </div>
        <div class="flex flex-col gap-1 border-b border-surface-200 pb-4">
          <span class="text-xs font-mono text-surface-400">text-xs — Caption (12px)</span>
          <p class="text-xs leading-relaxed">The UV Nexus design system provides consistent, accessible components for enterprise applications.</p>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs font-mono text-surface-400">Helper / label text</span>
          <small class="text-surface-400">This field is required. Maximum 500 characters.</small>
        </div>
      </div>
    `,
  }),
};

export const FontWeights: Story = {
  name: "Font Weights",
  render: () => ({
    template: `
      <div class="p-6 flex flex-col gap-4">
        <div v-for="w in weights" :key="w.class" class="flex items-center gap-6 py-2 border-b border-surface-100">
          <span class="text-xs font-mono text-surface-400 w-48 flex-shrink-0">{{ w.class }} / {{ w.weight }}</span>
          <span :class="['text-xl', w.class]">The quick brown fox</span>
        </div>
      </div>
    `,
    setup() {
      const weights = [
        { class: "font-light", weight: "300" },
        { class: "font-normal", weight: "400" },
        { class: "font-medium", weight: "500" },
        { class: "font-semibold", weight: "600" },
        { class: "font-bold", weight: "700" },
        { class: "font-extrabold", weight: "800" },
      ];
      return { weights };
    },
  }),
};

export const FontFamily: Story = {
  name: "Font Family",
  render: () => ({
    template: `
      <div class="p-6 max-w-2xl flex flex-col gap-6">
        <div class="flex flex-col gap-2 p-4 border border-surface-200 rounded">
          <span class="text-xs font-mono text-surface-400">font-sans — Source Sans 3 (primary)</span>
          <p class="font-sans text-2xl">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
          <p class="font-sans text-2xl">abcdefghijklmnopqrstuvwxyz</p>
          <p class="font-sans text-2xl">0123456789 !@#$%^&amp;*()</p>
        </div>
        <div class="flex flex-col gap-2 p-4 border border-surface-200 rounded">
          <span class="text-xs font-mono text-surface-400">font-mono — system monospace (code)</span>
          <p class="font-mono text-xl">const theme = UVNexusPreset;</p>
          <p class="font-mono text-xl">--uv-blue-50: #0095db;</p>
        </div>
      </div>
    `,
  }),
};
