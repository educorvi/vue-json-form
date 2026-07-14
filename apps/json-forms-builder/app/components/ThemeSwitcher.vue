<script setup lang="ts">
const { t } = useI18n();

type ThemeMode = 'system' | 'light' | 'dark';

const mode = ref<ThemeMode>('system');

const currentIcon = computed(() => {
    if (mode.value === 'light') return 'sun';
    if (mode.value === 'dark') return 'moon';
    return 'monitor';
});

const label = computed(() => {
    switch (mode.value) {
        case 'light':
            return t('theme.light');
        case 'dark':
            return t('theme.dark');
        default:
            return t('theme.system');
    }
});

function applyTheme(m: ThemeMode) {
    const html = document.documentElement;
    if (
        m === 'dark' ||
        (m === 'system' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
        html.setAttribute('data-bs-theme', 'dark');
    } else {
        html.setAttribute('data-bs-theme', 'light');
    }
}

function cycle() {
    const next: Record<ThemeMode, ThemeMode> = {
        system: 'light',
        light: 'dark',
        dark: 'system',
    };
    mode.value = next[mode.value];
    localStorage.setItem('theme', mode.value);
    applyTheme(mode.value);
}

onMounted(() => {
    const saved = (localStorage.getItem('theme') ?? 'system') as ThemeMode;
    mode.value = saved;
    applyTheme(saved);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => {
        if (mode.value === 'system') applyTheme('system');
    });
});
</script>

<template>
    <BButton
        variant="outline-secondary"
        size="sm"
        :title="label"
        @click="cycle"
    >
        <PhosphorIcon :name="currentIcon" />
        <span class="ms-1 d-sm-inline">{{ label }}</span>
    </BButton>
</template>
