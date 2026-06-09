/**
 * design-system.client.ts — applies the saved PrimeVue design system preset
 * (UV Corporate or Aura) before the first component mount.
 *
 * Must run as a client-only plugin so localStorage is available, and must run
 * BEFORE any component mounts so the correct preset is used from the start.
 * This prevents the flash of the wrong theme that was caused by applying the
 * preset only in a component's onMounted.
 */
import { usePrimeVue } from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import { UVNexusPreset } from '@educorvi/uv-theme';

const PRESETS = {
    uv: UVNexusPreset,
    aura: Aura,
} as const;

type DesignSystemKey = keyof typeof PRESETS;

export default defineNuxtPlugin(() => {
    const primevue = usePrimeVue();

    const saved = (localStorage.getItem('designSystem') ??
        'uv') as DesignSystemKey;
    const preset = PRESETS[saved] ?? PRESETS.uv;

    primevue.config.theme = {
        ...(primevue.config.theme as object),
        preset,
    };
});
