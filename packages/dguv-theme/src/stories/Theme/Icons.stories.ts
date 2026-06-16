import type { Meta, StoryObj } from '@storybook/vue3-vite';

/**
 * Phosphor Icons — the icon library used by the UV / DGUV design system.
 *
 * **Two usage variants:**
 *
 * 1. **CSS classes** (matches vanilla-sass / Angular usage):
 *    `<i class="ph ph-house"></i>` — imported from `@phosphor-icons/web`.
 *    Weights: ph-regular (default), ph-bold, ph-fill.
 *
 * 2. **Vue components** (registered globally via `app.use(PhosphorVue)`):
 *    `<PhHouse />`, `<PhTrash weight="fill" />` etc.
 *    Full catalogue: https://phosphoricons.com
 */
const meta: Meta = {
    title: 'Theme/Icons',
    parameters: {
        controls: { disable: true },
        docs: {
            description: {
                component:
                    'Phosphor Icons are the standard icon set for the UV / DGUV design system. ' +
                    'Both CSS class (`<i class="ph ph-house">`) and Vue component (`<PhHouse />`) usage are supported.',
            },
        },
    },
};
export default meta;
type Story = StoryObj;

/** CSS class icons — matches the vanilla-sass design system approach */
export const CSSIcons: Story = {
    name: 'CSS Icons (ph ph-*)',
    render: () => ({
        template: `
      <div class="p-6 flex flex-col gap-8">
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-3">
            Regular weight (default) — <code>ph ph-{name}</code>
          </p>
          <div class="flex flex-wrap gap-4">
            <div v-for="name in icons" :key="name"
                 class="flex flex-col items-center gap-2 w-20">
              <div class="w-10 h-10 flex items-center justify-center border border-surface-200 rounded text-primary-700">
                <i :class="'ph ph-' + name" style="font-size: 24px"></i>
              </div>
              <span class="text-xs text-center text-surface-400 leading-tight break-all">{{ name }}</span>
            </div>
          </div>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-3">
            Bold weight — <code>ph-bold ph-{name}</code>
          </p>
          <div class="flex flex-wrap gap-4">
            <div v-for="name in icons" :key="'bold-' + name"
                 class="flex flex-col items-center gap-2 w-20">
              <div class="w-10 h-10 flex items-center justify-center border border-surface-200 rounded text-primary-700">
                <i :class="'ph-bold ph-' + name" style="font-size: 24px"></i>
              </div>
              <span class="text-xs text-center text-surface-400 leading-tight break-all">{{ name }}</span>
            </div>
          </div>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-3">
            Fill weight — <code>ph-fill ph-{name}</code>
          </p>
          <div class="flex flex-wrap gap-4">
            <div v-for="name in icons" :key="'fill-' + name"
                 class="flex flex-col items-center gap-2 w-20">
              <div class="w-10 h-10 flex items-center justify-center border border-surface-200 rounded text-primary-700">
                <i :class="'ph-fill ph-' + name" style="font-size: 24px"></i>
              </div>
              <span class="text-xs text-center text-surface-400 leading-tight break-all">{{ name }}</span>
            </div>
          </div>
        </div>
        <p class="text-xs text-surface-400">
          Full catalogue at <a href="https://phosphoricons.com" target="_blank" class="text-primary-600">phosphoricons.com</a>.
          CSS icon name = component name in kebab-case without <code>Ph</code> prefix.
          Example: <code>&lt;PhArrowRight /&gt;</code> → <code>ph-arrow-right</code>.
        </p>
      </div>
    `,
        setup() {
            const icons = [
                'house',
                'user',
                'gear',
                'magnifying-glass',
                'bell',
                'check-circle',
                'warning',
                'info',
                'x-circle',
                'question',
                'arrow-right',
                'arrow-left',
                'caret-down',
                'list',
                'dots-three-vertical',
                'file',
                'folder-open',
                'envelope',
                'calendar',
                'cloud-arrow-up',
                'plus',
                'trash',
                'pencil-simple',
                'floppy-disk',
                'share-network',
            ];
            return { icons };
        },
    }),
};

// const ICON_GROUPS: { label: string; icons: string[] }[] = [
//   {
//     label: "Actions",
//     icons: [
//       "Check",
//       "X",
//       "Plus",
//       "Minus",
//       "PencilSimple",
//       "Trash",
//       "FloppyDisk",
//       "DownloadSimple",
//       "UploadSimple",
//       "ShareNetwork",
//       "Copy",
//       "MagnifyingGlass",
//       "ArrowCounterClockwise",
//       "Lock",
//       "LockOpen",
//       "Eye",
//       "EyeSlash",
//     ],
//   },
//   {
//     label: "Navigation",
//     icons: [
//       "ArrowUp",
//       "ArrowDown",
//       "ArrowLeft",
//       "ArrowRight",
//       "CaretUp",
//       "CaretDown",
//       "CaretLeft",
//       "CaretRight",
//       "House",
//       "List",
//       "DotsThree",
//       "DotsThreeVertical",
//     ],
//   },
//   {
//     label: "Feedback & Status",
//     icons: [
//       "CheckCircle",
//       "XCircle",
//       "Warning",
//       "Info",
//       "Question",
//       "Prohibit",
//       "Spinner",
//       "Clock",
//       "Hourglass",
//     ],
//   },
//   {
//     label: "Content & Objects",
//     icons: [
//       "File",
//       "FilePdf",
//       "FileDoc",
//       "FileXls",
//       "Folder",
//       "FolderOpen",
//       "Image",
//       "Images",
//       "Calendar",
//       "Bell",
//       "Bookmark",
//       "Heart",
//       "Star",
//       "Tag",
//       "Link",
//       "ArrowSquareOut",
//     ],
//   },
//   {
//     label: "People & Communication",
//     icons: [
//       "User",
//       "UserPlus",
//       "UserMinus",
//       "Users",
//       "Envelope",
//       "Phone",
//       "Chat",
//       "Chats",
//       "PaperPlaneRight",
//       "At",
//     ],
//   },
//   {
//     label: "System & Settings",
//     icons: [
//       "Gear",
//       "Wrench",
//       "SlidersHorizontal",
//       "Database",
//       "Desktop",
//       "DeviceMobile",
//       "DeviceTablet",
//       "WifiHigh",
//       "Cloud",
//       "CloudArrowUp",
//       "CloudArrowDown",
//     ],
//   },
//   {
//     label: "Media",
//     icons: [
//       "Play",
//       "Pause",
//       "Stop",
//       "SkipForward",
//       "SkipBack",
//       "FastForward",
//       "Rewind",
//       "SpeakerHigh",
//       "SpeakerLow",
//       "SpeakerNone",
//     ],
//   },
// ];

// export const IconReference: Story = {
//   name: "Icon Reference",
//   render: () => ({
//     setup() {
//       return { ICON_GROUPS };
//     },
//     template: `
//       <div class="p-6 flex flex-col gap-10">
//         <div v-for="group in ICON_GROUPS" :key="group.label">
//           <p class="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-4">
//             {{ group.label }}
//           </p>
//           <div class="flex flex-wrap gap-4">
//             <div
//               v-for="name in group.icons"
//               :key="name"
//               class="flex flex-col items-center gap-2 w-24 cursor-default"
//               :title="'<Ph' + name + ' />'"
//             >
//               <div class="w-10 h-10 flex items-center justify-center rounded border border-surface-200 text-surface-700">
//                 <component :is="'Ph' + name" :size="20" />
//               </div>
//               <span class="text-xs text-center text-surface-500 leading-tight break-all">
//                 Ph{{ name }}
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>
//     `,
//   }),
// };

export const IconWeights: Story = {
    name: 'Icon Weights',
    render: () => ({
        setup() {
            const weights = [
                'thin',
                'light',
                'regular',
                'bold',
                'fill',
                'duotone',
            ];
            return { weights };
        },
        template: `
      <div class="p-6 flex flex-col gap-6">
        <div
          v-for="w in weights"
          :key="w"
          class="flex items-center gap-6 py-3 border-b border-surface-100"
        >
          <span class="text-xs font-mono text-surface-400 w-20 flex-shrink-0">{{ w }}</span>
          <PhHouse :weight="w" :size="24" class="text-primary-500" />
          <PhTrash :weight="w" :size="24" class="text-danger-500" />
          <PhCheckCircle :weight="w" :size="24" class="text-success-500" />
          <PhWarning :weight="w" :size="24" class="text-warning-500" />
          <PhInfo :weight="w" :size="24" class="text-info-500" />
        </div>
      </div>
    `,
    }),
};

export const IconSizes: Story = {
    name: 'Icon Sizes',
    render: () => ({
        setup() {
            const sizes = [
                { size: 12, label: '12 px — caption / badge' },
                { size: 14, label: '14 px — inline with small text' },
                { size: 16, label: '16 px — default body' },
                { size: 20, label: '20 px — button / input' },
                { size: 24, label: '24 px — heading companion' },
                { size: 32, label: '32 px — hero / empty state' },
                { size: 48, label: '48 px — illustration' },
            ];
            return { sizes };
        },
        template: `
      <div class="p-6 flex flex-col gap-4">
        <div
          v-for="s in sizes"
          :key="s.size"
          class="flex items-center gap-6 py-2 border-b border-surface-100"
        >
          <span class="text-xs font-mono text-surface-400 w-16 flex-shrink-0">{{ s.size }}px</span>
          <PhHouse :size="s.size" class="text-primary-500 flex-shrink-0" />
          <span class="text-sm text-surface-500">{{ s.label }}</span>
        </div>
      </div>
    `,
    }),
};

export const IconInComponents: Story = {
    name: 'Icons in Components',
    render: () => ({
        template: `
      <div class="p-6 flex flex-col gap-8">

        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-3">
            Buttons with icons (slot usage)
          </p>
          <div class="flex flex-wrap gap-3 items-center">
            <Button>
              <template #icon><PhFloppyDisk :size="16" weight="bold" /></template>
              Save
            </Button>
            <Button severity="danger">
              <template #icon><PhTrash :size="16" weight="bold" /></template>
              Delete
            </Button>
            <Button variant="outlined">
              <template #icon><PhShareNetwork :size="16" /></template>
              Share
            </Button>
            <Button aria-label="Add item">
              <template #icon><PhPlus :size="16" weight="bold" /></template>
            </Button>
            <Button variant="text" aria-label="Search">
              <template #icon><PhMagnifyingGlass :size="16" /></template>
            </Button>
          </div>
        </div>

        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-3">
            Tags with icons
          </p>
          <div class="flex flex-wrap gap-3 items-center">
            <Tag value="New">
              <template #icon><PhPlus :size="12" weight="bold" class="mr-1" /></template>
            </Tag>
            <Tag value="Done" severity="success">
              <template #icon><PhCheck :size="12" weight="bold" class="mr-1" /></template>
            </Tag>
            <Tag value="Error" severity="danger">
              <template #icon><PhX :size="12" weight="bold" class="mr-1" /></template>
            </Tag>
          </div>
        </div>

        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-3">
            Standalone coloured icons
          </p>
          <div class="flex flex-wrap gap-4 items-center">
            <PhCheckCircle :size="24" weight="fill" class="text-success-500" />
            <PhXCircle     :size="24" weight="fill" class="text-danger-500"  />
            <PhWarning     :size="24" weight="fill" class="text-warning-500" />
            <PhInfo        :size="24" weight="fill" class="text-info-500"    />
          </div>
        </div>

      </div>
    `,
    }),
};
