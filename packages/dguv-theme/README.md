# @educorvi/uv-theme

UV corporate design system for Vue 3 — PrimeVue 4 preset, Source Sans 3 font,
UV brand colour palette, and Tailwind CSS v4 integration.

| What | Export |
|------|--------|
| PrimeVue theme preset | `import { UVNexusPreset } from '@educorvi/uv-theme'` |
| Global CSS (colours, font, Tailwind overrides) | `@import '@educorvi/uv-theme/styles'` |
| Storybook component showcase | `yarn storybook` |

---

## Quick start

### 1 — Install peer dependencies

```sh
npm install primevue @primeuix/themes tailwindcss tailwindcss-primeui \
            primeicons @phosphor-icons/vue
```

Add `@educorvi/uv-theme` as a dependency. In this monorepo: `"workspace:*"`.

---

### 2 — Register PrimeVue with the UV preset (`main.ts`)

```ts
import PrimeVue from 'primevue/config';
import { UVNexusPreset } from '@educorvi/uv-theme';
import ToastService from 'primevue/toastservice';
import PhosphorVue from '@phosphor-icons/vue';

app.use(PrimeVue, {
  theme: {
    preset: UVNexusPreset,
    options: {
      prefix: 'p',
      // Class toggled on <html> to switch dark mode.
      // Must match the @custom-variant in your CSS.
      darkModeSelector: '.my-app-dark',
    },
  },
});

app.use(PhosphorVue);   // registers all <PhXxx /> icon components globally
app.use(ToastService);
```

---

### 3 — Import the global CSS

In your app's entry stylesheet (e.g. `src/assets/main.css`):

```css
/* 1. Tailwind base */
@import 'tailwindcss';

/* 2. Maps PrimeVue --p-* design tokens to Tailwind colour utilities */
@import 'tailwindcss-primeui';

/* 3. UV colour palette, @font-face for Source Sans 3, Tailwind colour overrides */
@import '@educorvi/uv-theme/styles';

/* 4. Register the dark mode Tailwind variant to match PrimeVue's selector */
@custom-variant dark (&:where(.my-app-dark, .my-app-dark *));
```

---

### 4 — Source Sans 3 font

The `@font-face` declarations are bundled inside `@educorvi/uv-theme/styles` —
no CDN or network request required. The font files are variable-weight TTFs
(weight range 200–900) shipped with the package.

Apply the font via the exposed CSS custom property:

```css
body {
  font-family: var(--uv-font-sans);  /* 'Source Sans 3', system-ui, … */
}
```

Tailwind v4 also wires `--font-sans` to `--uv-font-sans`, so the utility class
works out of the box:

```html
<body class="font-sans">…</body>
```

---

### 5 — Phosphor Icons

After `app.use(PhosphorVue)`, every Phosphor icon is available globally as a
`<PhXxx />` component:

```html
<!-- Basic usage -->
<PhHouse :size="24" />

<!-- Weight variants: thin | light | regular (default) | bold | fill | duotone -->
<PhTrash :size="20" weight="fill" class="text-danger-500" />
<PhCheckCircle :size="24" weight="fill" class="text-success-500" />
```

Browse the full catalogue at **[phosphoricons.com](https://phosphoricons.com)**.

---

### 6 — Dark mode

The UV preset activates dark mode when the class `.my-app-dark` is present on
the `<html>` element. Toggle it from anywhere in your app:

```ts
function setDarkMode(enabled: boolean) {
  document.documentElement.classList.toggle('my-app-dark', enabled);
}
```

Persist the preference using `localStorage`:

```ts
const prefersDark =
  localStorage.getItem('theme') === 'dark' ||
  (!localStorage.getItem('theme') &&
    window.matchMedia('(prefers-color-scheme: dark)').matches);

setDarkMode(prefersDark);
```

---

## Storybook

```sh
cd packages/uv-theme
yarn storybook          # dev server → http://localhost:6006
yarn build-storybook    # static build → storybook-static/
```

The **☀ / ☾ Color scheme** button in the top toolbar toggles dark mode for all
stories.

The Storybook manager chrome is themed on startup based on the OS colour
preference (configured in `.storybook/manager.ts`).

---

## Applied in `@educorvi/vue-form-builder`

The [`vue-form-builder`](../vue-form-builder) package is the reference consumer
of this theme. Each step above maps to a concrete file:

| Step | File | Change |
|------|------|--------|
| PrimeVue preset | `src/main.ts` | `app.use(PrimeVue, { theme: { preset: UVNexusPreset, … } })` |
| Phosphor Icons | `src/main.ts` | `app.use(PhosphorVue)` |
| CSS import | `src/assets/main.css` | `@import '@educorvi/uv-theme/styles'` |
| Dark variant | `src/assets/main.css` | `@custom-variant dark (…)` |

---
