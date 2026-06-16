import type { Meta, StoryObj } from '@storybook/vue3-vite';

const meta: Meta = {
    title: 'Theme/Typography',
    parameters: {
        controls: { disable: true },
        docs: {
            description: {
                component:
                    'DGUV / UV Nexus typography scale — Source Sans 3 as the primary typeface. ' +
                    'Heading sizes and weights are driven by the same design tokens used in the ' +
                    'vanilla-sass and Angular design systems (`--sys-typography-*` / `--sys-typographie-*`). ' +
                    'Headings use UV Primary Blue (#004994) matching `--surface-accent → --ref-color-primary-70`.',
            },
        },
    },
};
export default meta;
type Story = StoryObj;

export const Headings: Story = {
    name: 'Headings',
    render: () => ({
        template: `
      <div class="dguv-content p-6 flex flex-col gap-5">
        <div v-for="h in headings" :key="h.tag"
             class="flex items-baseline gap-4 border-b border-surface-200 pb-4">
          <component :is="h.tag" class="flex-1" style="margin: 0">{{ h.label }}</component>
          <div class="text-right flex-shrink-0">
            <span class="block text-xs font-mono text-surface-400">{{ h.tag.toUpperCase() }} · {{ h.token }}</span>
            <span class="block text-xs font-mono text-surface-300">{{ h.size }} / {{ h.weight }}</span>
          </div>
        </div>
        <p class="text-xs text-surface-400 mt-2">
          Sizes are responsive: mobile values shown. All headings use <code>--ref-font-family</code> = Source Sans 3
          and <code>color: var(--uv-blue-70)</code> = #004994.
        </p>
      </div>
    `,
        setup() {
            const headings = [
                {
                    tag: 'h1',
                    label: 'Heading 1 — Display',
                    token: '--sys-typography-h1-*',
                    size: '1.75rem / 2rem (desktop)',
                    weight: '700',
                },
                {
                    tag: 'h2',
                    label: 'Heading 2 — Headline XL',
                    token: '--sys-typography-h2-*',
                    size: '1.5rem / 1.75rem (desktop)',
                    weight: '600',
                },
                {
                    tag: 'h3',
                    label: 'Heading 3 — Headline L',
                    token: '--sys-typography-h3-*',
                    size: '1.375rem / 1.5rem (desktop)',
                    weight: '600',
                },
                {
                    tag: 'h4',
                    label: 'Heading 4 — Headline M',
                    token: '--sys-typography-h4-*',
                    size: '1.25rem',
                    weight: '600',
                },
                {
                    tag: 'h5',
                    label: 'Heading 5 — Headline S',
                    token: '--sys-typography-h5-*',
                    size: '1.125rem',
                    weight: '600',
                },
                {
                    tag: 'h6',
                    label: 'Heading 6 — Headline XS',
                    token: '--sys-typography-h6-*',
                    size: '1rem',
                    weight: '600',
                },
            ];
            return { headings };
        },
    }),
};

export const BodyText: Story = {
    name: 'Body Text',
    render: () => ({
        template: `
      <div class="p-6 flex flex-col gap-6 max-w-2xl">
        <div v-for="entry in entries" :key="entry.token"
             class="flex flex-col gap-1 border-b border-surface-200 pb-4">
          <span class="text-xs font-mono text-surface-400">{{ entry.token }} — {{ entry.label }}</span>
          <p :style="{ fontSize: entry.size, lineHeight: entry.lineHeight, fontWeight: entry.weight }">
            DGUV design system provides consistent, accessible components built on PrimeVue and Tailwind.
          </p>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs font-mono text-surface-400">--sys-typography-caption-* — Caption / label</span>
          <small style="font-size: var(--sys-typographie-body-sm-font-size); line-height: var(--sys-typographie-body-sm-line-height)">
            This field is required. Maximum 500 characters.
          </small>
        </div>
      </div>
    `,
        setup() {
            const entries = [
                {
                    token: '--sys-typography-body-regular-*',
                    label: 'Body regular (1rem / 1.5rem)',
                    size: 'var(--sys-typographie-body-md-font-size)',
                    lineHeight: 'var(--sys-typographie-body-md-line-height)',
                    weight: '400',
                },
                {
                    token: '--sys-typography-body-strong-*',
                    label: 'Body strong (1rem / 1.5rem, w600)',
                    size: 'var(--sys-typographie-body-md-font-size)',
                    lineHeight: 'var(--sys-typographie-body-md-line-height)',
                    weight: '600',
                },
                {
                    token: '--sys-typographie-body-lg-*',
                    label: 'Body large (1.125rem / 1.625rem)',
                    size: 'var(--sys-typographie-body-lg-font-size)',
                    lineHeight: 'var(--sys-typographie-body-lg-line-height)',
                    weight: '400',
                },
            ];
            return { entries };
        },
    }),
};

export const FontWeights: Story = {
    name: 'Font Weights',
    render: () => ({
        template: `
      <div class="p-6 flex flex-col gap-4">
        <p class="text-xs text-surface-400 mb-2">Source Sans 3 is loaded for weights 400, 600, and 700.
          Only those weights render with the custom font; others fall back to system-ui.</p>
        <div v-for="w in weights" :key="w.weight"
             class="flex items-center gap-6 py-2 border-b border-surface-100">
          <span class="text-xs font-mono text-surface-400 w-52 flex-shrink-0">
            {{ w.token }}<br/>font-weight: {{ w.weight }}
          </span>
          <span :style="{ fontWeight: w.weight }" class="text-xl">
            The quick brown fox jumps over the lazy dog — 0123456789
          </span>
        </div>
      </div>
    `,
        setup() {
            const weights = [
                { weight: '400', token: '--ref-font-weight-400 (regular)' },
                { weight: '600', token: '--ref-font-weight-600 (semibold)' },
                { weight: '700', token: '--ref-font-weight-700 (bold)' },
            ];
            return { weights };
        },
    }),
};

export const FontFamily: Story = {
    name: 'Font Family',
    render: () => ({
        template: `
      <div class="p-6 max-w-2xl flex flex-col gap-6">
        <div class="flex flex-col gap-2 p-4 border border-surface-200 rounded">
          <span class="text-xs font-mono text-surface-400">--ref-font-family / --uv-font-sans — Source Sans 3</span>
          <p style="font-family: var(--ref-font-family)" class="text-2xl">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
          <p style="font-family: var(--ref-font-family)" class="text-2xl">abcdefghijklmnopqrstuvwxyz</p>
          <p style="font-family: var(--ref-font-family)" class="text-2xl">0123456789 !@#$%^&amp;*()</p>
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

// export const Headings: Story = {
//   name: "Headings",
//   render: () => ({
//     template: `
//       <div class="p-6 flex flex-col gap-6">
//         <div class="flex items-baseline gap-4 border-b border-surface-200 pb-4">
//           <h1 class="text-5xl font-bold leading-tight flex-1">Heading 1 — 3rem / 48px</h1>
//           <span class="text-xs font-mono text-surface-400 flex-shrink-0">text-5xl · font-bold</span>
//         </div>
//         <div class="flex items-baseline gap-4 border-b border-surface-200 pb-4">
//           <h2 class="text-4xl font-bold leading-tight flex-1">Heading 2 — 2.25rem / 36px</h2>
//           <span class="text-xs font-mono text-surface-400 flex-shrink-0">text-4xl · font-bold</span>
//         </div>
//         <div class="flex items-baseline gap-4 border-b border-surface-200 pb-4">
//           <h3 class="text-3xl font-semibold leading-snug flex-1">Heading 3 — 1.875rem / 30px</h3>
//           <span class="text-xs font-mono text-surface-400 flex-shrink-0">text-3xl · font-semibold</span>
//         </div>
//         <div class="flex items-baseline gap-4 border-b border-surface-200 pb-4">
//           <h4 class="text-2xl font-semibold leading-snug flex-1">Heading 4 — 1.5rem / 24px</h4>
//           <span class="text-xs font-mono text-surface-400 flex-shrink-0">text-2xl · font-semibold</span>
//         </div>
//         <div class="flex items-baseline gap-4 border-b border-surface-200 pb-4">
//           <h5 class="text-xl font-semibold leading-normal flex-1">Heading 5 — 1.25rem / 20px</h5>
//           <span class="text-xs font-mono text-surface-400 flex-shrink-0">text-xl · font-semibold</span>
//         </div>
//         <div class="flex items-baseline gap-4">
//           <h6 class="text-base font-semibold leading-normal flex-1">Heading 6 — 1rem / 16px</h6>
//           <span class="text-xs font-mono text-surface-400 flex-shrink-0">text-base · font-semibold</span>
//         </div>
//       </div>
//     `,
//   }),
// };

// export const BodyText: Story = {
//   name: "Body Text",
//   render: () => ({
//     template: `
//       <div class="p-6 flex flex-col gap-6 max-w-2xl">
//         <div class="flex flex-col gap-1 border-b border-surface-200 pb-4">
//           <span class="text-xs font-mono text-surface-400">text-xl — Large body</span>
//           <p class="text-xl leading-relaxed">The UV Nexus design system provides consistent, accessible components for enterprise applications built on PrimeVue and Tailwind.</p>
//         </div>
//         <div class="flex flex-col gap-1 border-b border-surface-200 pb-4">
//           <span class="text-xs font-mono text-surface-400">text-base — Default body (16px)</span>
//           <p class="text-base leading-relaxed">The UV Nexus design system provides consistent, accessible components for enterprise applications built on PrimeVue and Tailwind.</p>
//         </div>
//         <div class="flex flex-col gap-1 border-b border-surface-200 pb-4">
//           <span class="text-xs font-mono text-surface-400">text-sm — Small body (14px)</span>
//           <p class="text-sm leading-relaxed">The UV Nexus design system provides consistent, accessible components for enterprise applications built on PrimeVue and Tailwind.</p>
//         </div>
//         <div class="flex flex-col gap-1 border-b border-surface-200 pb-4">
//           <span class="text-xs font-mono text-surface-400">text-xs — Caption (12px)</span>
//           <p class="text-xs leading-relaxed">The UV Nexus design system provides consistent, accessible components for enterprise applications.</p>
//         </div>
//         <div class="flex flex-col gap-1">
//           <span class="text-xs font-mono text-surface-400">Helper / label text</span>
//           <small class="text-surface-400">This field is required. Maximum 500 characters.</small>
//         </div>
//       </div>
//     `,
//   }),
// };

// export const FontWeights: Story = {
//   name: "Font Weights",
//   render: () => ({
//     template: `
//       <div class="p-6 flex flex-col gap-4">
//         <div v-for="w in weights" :key="w.class" class="flex items-center gap-6 py-2 border-b border-surface-100">
//           <span class="text-xs font-mono text-surface-400 w-48 flex-shrink-0">{{ w.class }} / {{ w.weight }}</span>
//           <span :class="['text-xl', w.class]">The quick brown fox</span>
//         </div>
//       </div>
//     `,
//     setup() {
//       const weights = [
//         { class: "font-light", weight: "300" },
//         { class: "font-normal", weight: "400" },
//         { class: "font-medium", weight: "500" },
//         { class: "font-semibold", weight: "600" },
//         { class: "font-bold", weight: "700" },
//         { class: "font-extrabold", weight: "800" },
//       ];
//       return { weights };
//     },
//   }),
// };

// export const FontFamily: Story = {
//   name: "Font Family",
//   render: () => ({
//     template: `
//       <div class="p-6 max-w-2xl flex flex-col gap-6">
//         <div class="flex flex-col gap-2 p-4 border border-surface-200 rounded">
//           <span class="text-xs font-mono text-surface-400">font-sans — Source Sans 3 (primary)</span>
//           <p class="font-sans text-2xl">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
//           <p class="font-sans text-2xl">abcdefghijklmnopqrstuvwxyz</p>
//           <p class="font-sans text-2xl">0123456789 !@#$%^&amp;*()</p>
//         </div>
//         <div class="flex flex-col gap-2 p-4 border border-surface-200 rounded">
//           <span class="text-xs font-mono text-surface-400">font-mono — system monospace (code)</span>
//           <p class="font-mono text-xl">const theme = UVNexusPreset;</p>
//           <p class="font-mono text-xl">--uv-blue-50: #0095db;</p>
//         </div>
//       </div>
//     `,
//   }),
// };
