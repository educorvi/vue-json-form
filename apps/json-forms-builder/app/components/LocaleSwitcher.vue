<script setup lang="ts">
// import { PhGlobe, PhCheck } from '@phosphor-icons/vue';

const { locale, setLocale } = useI18n();

interface LocaleOption {
    code: string;
    flag: string;
    name: string;
}

const locales: LocaleOption[] = [
    { code: 'en', flag: '🇬🇧', name: 'English' },
    { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
];

const selected = computed({
    get: () =>
        (locales.find((l) => l.code === locale.value) ??
            locales[0]) as LocaleOption, // TODO: remove cast
    set: (l: LocaleOption) => setLocale(l.code as 'en' | 'de'),
});
</script>

<template>
    <BDropdown variant="outline-secondary" size="sm" class="locale-switcher">
        <template #button-content>
            <!-- <PhGlobe :size="16" class="me-1" /> -->
            {{ selected.name }}
        </template>
        <BDropdownItem
            v-for="loc in locales"
            :key="loc.code"
            :active="loc.code === selected.code"
            @click="selected = loc"
        >
            <span class="me-2">{{ loc.flag }}</span>
            {{ loc.name }}
            <!-- <PhCheck
                v-if="loc.code === selected.code"
                :size="14"
                class="ms-auto text-primary"
            /> -->
        </BDropdownItem>
    </BDropdown>
</template>
