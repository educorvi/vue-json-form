<script setup lang="ts">
const { t } = useI18n();
const preferences = usePreferencesStore();

const label = computed(() => t(`theme.${preferences.themeMode}`));
</script>

<template>
    <BButton
        variant="outline-secondary"
        size="sm"
        :title="label"
        data-testid="theme-switcher"
        @click="preferences.cycleTheme"
    >
        <Icon :name="preferences.themeIcon" />
        <span class="ms-1 d-sm-inline">{{ label }}</span>
    </BButton>
</template>
