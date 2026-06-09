<script setup lang="ts">
/**
 * ThemeSwitcher — standalone, framework-agnostic (no Nuxt auto-imports).
 * Cycles through system / light / dark modes.
 *
 * Props:
 *   darkModeSelector  CSS class added to <html> for dark mode (default: 'app-dark')
 *   storageKey        localStorage key used to persist the user's choice (default: 'theme')
 */
import { ref, computed, onMounted } from 'vue';
import Button from 'primevue/button';

type Mode = 'system' | 'light' | 'dark';

const props = withDefaults(
    defineProps<{
        darkModeSelector?: string;
        storageKey?: string;
    }>(),
    {
        darkModeSelector: 'app-dark',
        storageKey: 'theme',
    }
);

const mode = ref<Mode>('system');

const icon = computed(() => {
    if (mode.value === 'light') return 'pi pi-sun';
    if (mode.value === 'dark') return 'pi pi-moon';
    return 'pi pi-desktop';
});

const tooltip = computed(() => {
    if (mode.value === 'light') return 'Light mode';
    if (mode.value === 'dark') return 'Dark mode';
    return 'System theme';
});

function applyMode(m: Mode) {
    const html = document.documentElement;
    // Strip leading dot so both '.app-dark' and 'app-dark' work
    const cls = props.darkModeSelector.replace(/^\./, '');
    const isDark =
        m === 'dark' ||
        (m === 'system' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
        html.classList.add(cls);
    } else {
        html.classList.remove(cls);
    }
}

function cycle() {
    const next: Record<Mode, Mode> = {
        system: 'light',
        light: 'dark',
        dark: 'system',
    };
    mode.value = next[mode.value];
    localStorage.setItem(props.storageKey, mode.value);
    applyMode(mode.value);
}

onMounted(() => {
    const saved = (localStorage.getItem(props.storageKey) ?? 'system') as Mode;
    mode.value = saved;
    applyMode(saved);
    window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', () => {
            if (mode.value === 'system') applyMode('system');
        });
});
</script>

<template>
    <Button
        :icon="icon"
        v-tooltip.bottom="tooltip"
        text
        rounded
        aria-label="Toggle theme"
        @click="cycle"
    />
</template>
