<script setup lang="ts">
/**
 * ThemeSwitcher — cycles through system / light / dark modes.
 * Uses PrimeVue's darkModeSelector class (.app-dark on <html>).
 * Reusable on both the landing page and the authenticated layout.
 */
const { t } = useI18n();

const mode = ref<'system' | 'light' | 'dark'>('system');

const icon = computed(() => {
    if (mode.value === 'light') return 'pi pi-sun';
    if (mode.value === 'dark') return 'pi pi-moon';
    return 'pi pi-desktop';
});

const tooltip = computed(() => {
    if (mode.value === 'light') return t('theme.light');
    if (mode.value === 'dark') return t('theme.dark');
    return t('theme.system');
});

function applyMode(m: 'system' | 'light' | 'dark') {
    const html = document.documentElement;
    if (
        m === 'dark' ||
        (m === 'system' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
        html.classList.add('app-dark');
    } else {
        html.classList.remove('app-dark');
    }
}

function cycle() {
    const next: Record<
        'system' | 'light' | 'dark',
        'system' | 'light' | 'dark'
    > = {
        system: 'light',
        light: 'dark',
        dark: 'system',
    };
    mode.value = next[mode.value];
    localStorage.setItem('theme', mode.value);
    applyMode(mode.value);
}

onMounted(() => {
    const saved = (localStorage.getItem('theme') ?? 'system') as
        | 'system'
        | 'light'
        | 'dark';
    mode.value = saved;
    applyMode(saved);

    // Keep system mode in sync when OS preference changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => {
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
