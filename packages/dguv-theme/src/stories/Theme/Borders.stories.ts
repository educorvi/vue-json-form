import type { Meta, StoryObj } from "@storybook/vue3-vite";

const meta: Meta = {
  title: "Theme/Borders & Shadows",
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component:
          "UV Nexus border radius tokens and elevation / shadow scale used across components.",
      },
    },
  },
};
export default meta;
type Story = StoryObj;

export const BorderRadius: Story = {
  name: "Border Radius",
  render: () => ({
    template: `
      <div class="p-6 flex flex-col gap-8">
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-4">Component defaults</p>
          <div class="flex flex-wrap gap-6">
            <div class="flex flex-col items-center gap-2">
              <div class="w-24 h-16 bg-primary-100 border-2 border-primary-400 rounded-none flex items-center justify-center text-primary-700 text-xs font-mono">0px</div>
              <span class="text-xs text-surface-500">Button, Input</span>
              <span class="text-xs font-mono text-surface-400">rounded-none</span>
            </div>
            <div class="flex flex-col items-center gap-2">
              <div class="w-24 h-16 bg-primary-100 border-2 border-primary-400 rounded flex items-center justify-center text-primary-700 text-xs font-mono">4px</div>
              <span class="text-xs text-surface-500">Tag, Badge</span>
              <span class="text-xs font-mono text-surface-400">rounded / 0.25rem</span>
            </div>
            <div class="flex flex-col items-center gap-2">
              <div class="w-24 h-16 bg-primary-100 border-2 border-primary-400 rounded-md flex items-center justify-center text-primary-700 text-xs font-mono">6px</div>
              <span class="text-xs text-surface-500">Panel, Tooltip</span>
              <span class="text-xs font-mono text-surface-400">rounded-md / 0.375rem</span>
            </div>
            <div class="flex flex-col items-center gap-2">
              <div class="w-24 h-16 bg-primary-100 border-2 border-primary-400 rounded-lg flex items-center justify-center text-primary-700 text-xs font-mono">8px</div>
              <span class="text-xs text-surface-500">Dialog, Card</span>
              <span class="text-xs font-mono text-surface-400">rounded-lg / 0.5rem</span>
            </div>
            <div class="flex flex-col items-center gap-2">
              <div class="w-24 h-16 bg-primary-100 border-2 border-primary-400 rounded-full flex items-center justify-center text-primary-700 text-xs font-mono">9999px</div>
              <span class="text-xs text-surface-500">Chip, Pill tag</span>
              <span class="text-xs font-mono text-surface-400">rounded-full</span>
            </div>
          </div>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-4">Focus ring</p>
          <div class="flex gap-6 flex-wrap">
            <div class="flex flex-col items-center gap-2">
              <div class="w-32 h-10 bg-white border border-surface-300 rounded-none outline outline-2 outline-offset-2 outline-primary-500 flex items-center justify-center text-xs text-surface-500">Focused input</div>
              <span class="text-xs font-mono text-surface-400">outline-2 + outline-primary-500</span>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};

export const Shadows: Story = {
  name: "Shadows & Elevation",
  render: () => ({
    template: `
      <div class="p-8 flex flex-col gap-10">
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-6">Tailwind shadow scale</p>
          <div class="flex flex-wrap gap-8">
            <div v-for="s in shadowScale" :key="s.class" class="flex flex-col items-center gap-3">
              <div class="w-24 h-20 bg-white rounded flex items-center justify-center" :class="s.class">
                <span class="text-xs text-surface-400 font-mono">{{ s.label }}</span>
              </div>
              <span class="text-xs font-mono text-surface-500">{{ s.class }}</span>
            </div>
          </div>
        </div>

        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-4">UV Nexus — cards have no shadow</p>
          <div class="flex gap-6 flex-wrap">
            <div class="p-card" style="padding: 1.25rem; border: 1px solid var(--p-surface-border); width: 14rem;">
              <p class="text-sm font-semibold mb-1">Card (no shadow)</p>
              <p class="text-xs text-surface-400">UV theme: card.root.shadow = none, uses 1px border instead.</p>
            </div>
            <div class="p-card shadow-md" style="padding: 1.25rem; border: 1px solid var(--p-surface-border); width: 14rem;">
              <p class="text-sm font-semibold mb-1">Card + shadow-md</p>
              <p class="text-xs text-surface-400">Optional elevation via Tailwind shadow utility.</p>
            </div>
          </div>
        </div>

        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-4">Border styles</p>
          <div class="flex flex-col gap-3 max-w-sm">
            <div class="flex items-center gap-4">
              <div class="h-px flex-1 bg-surface-200"></div>
              <span class="text-xs font-mono text-surface-400">border-surface-200 — default divider</span>
            </div>
            <div class="flex items-center gap-4">
              <div class="h-px flex-1 bg-surface-300"></div>
              <span class="text-xs font-mono text-surface-400">border-surface-300 — input default</span>
            </div>
            <div class="flex items-center gap-4">
              <div class="h-px flex-1 bg-primary-500"></div>
              <span class="text-xs font-mono text-surface-400">border-primary-500 — focus / active</span>
            </div>
            <div class="flex items-center gap-4">
              <div class="h-px flex-1 bg-red-500"></div>
              <span class="text-xs font-mono text-surface-400">border-red-500 — error / invalid</span>
            </div>
          </div>
        </div>
      </div>
    `,
    setup() {
      const shadowScale = [
        { class: "shadow-none", label: "none" },
        { class: "shadow-sm", label: "sm" },
        { class: "shadow", label: "default" },
        { class: "shadow-md", label: "md" },
        { class: "shadow-lg", label: "lg" },
        { class: "shadow-xl", label: "xl" },
      ];
      return { shadowScale };
    },
  }),
};

export const Spacing: Story = {
  name: "Spacing Scale",
  render: () => ({
    template: `
      <div class="p-6 flex flex-col gap-2">
        <p class="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-4">Common spacing tokens (Tailwind)</p>
        <div v-for="s in spacings" :key="s.class" class="flex items-center gap-4 py-1 border-b border-surface-100">
          <span class="text-xs font-mono text-surface-400 w-20 flex-shrink-0">{{ s.class }}</span>
          <span class="text-xs text-surface-400 w-12 flex-shrink-0">{{ s.px }}</span>
          <div class="h-4 bg-primary-300 rounded-sm" :style="{ width: s.width }"></div>
        </div>
      </div>
    `,
    setup() {
      const spacings = [
        { class: "p-1", px: "4px", width: "4px" },
        { class: "p-2", px: "8px", width: "8px" },
        { class: "p-3", px: "12px", width: "12px" },
        { class: "p-4", px: "16px", width: "16px" },
        { class: "p-5", px: "20px", width: "20px" },
        { class: "p-6", px: "24px", width: "24px" },
        { class: "p-8", px: "32px", width: "32px" },
        { class: "p-10", px: "40px", width: "40px" },
        { class: "p-12", px: "48px", width: "48px" },
        { class: "p-16", px: "64px", width: "64px" },
        { class: "p-20", px: "80px", width: "80px" },
      ];
      return { spacings };
    },
  }),
};
