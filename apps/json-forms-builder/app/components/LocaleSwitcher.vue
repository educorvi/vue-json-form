<script setup lang="ts">
const preferences = usePreferencesStore();

const selected = computed({
    get: () =>
        preferences.locales.find((l) => l.code === preferences.locale) ??
        preferences.locales[0],
    set: (l) => preferences.changeLocale(l.code),
});
</script>

<template>
    <BDropdown
        variant="outline-secondary"
        size="sm"
        class="d-grid gap-2 mb-2"
        data-testid="locale-switcher"
        :toggle-attrs="{ 'data-testid': 'locale-switcher-toggle' }"
    >
        <template #button-content>
            {{ selected.name }}
        </template>
        <BDropdownItem
            v-for="loc in preferences.locales"
            :key="loc.code"
            :active="loc.code === selected.code"
            :data-testid="`locale-option-${loc.code}`"
            @click="selected = loc"
        >
            <span class="me-2">{{ loc.flag }}</span>
            {{ loc.name }}
        </BDropdownItem>
    </BDropdown>
</template>
