<script setup lang="ts">
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
    get: () => locales.find((l) => l.code === locale.value) ?? locales[0],
    set: (l: LocaleOption) => setLocale(l.code as 'en' | 'de'),
});
</script>

<template>
    <Select
        v-model="selected"
        :options="locales"
        option-label="name"
        class="w-full"
    >
        <template #value="{ value }">
            <span class="flex items-center gap-2">
                <span>{{ value.flag }}</span>
                <span>{{ value.name }}</span>
            </span>
        </template>
        <template #option="{ option }">
            <span class="flex items-center gap-2">
                <span>{{ option.flag }}</span>
                <span>{{ option.name }}</span>
            </span>
        </template>
    </Select>
</template>
