<script setup lang="ts" generic="T extends string">
/**
 * Generic search + sort bar reusable across Users, Groups, Projects, etc.
 */

const props = defineProps<{
    search: string;
    orderBy: T;
    sortOrder: 'asc' | 'desc';
    sortOptions: { label: string; value: T }[];
    searchPlaceholder?: string;
}>();

const emit = defineEmits<{
    'update:search': [value: string];
    'update:orderBy': [value: T];
    'update:sortOrder': [value: 'asc' | 'desc'];
}>();

const { t } = useI18n();

let debounceTimer: ReturnType<typeof setTimeout>;

function onSearchInput(e: Event) {
    // Read value immediately — do NOT bind :value back from the prop,
    // as that would force-reset the DOM input and interrupt typing.
    const val = (e.target as HTMLInputElement).value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => emit('update:search', val), 400);
}

function toggleSortOrder() {
    emit('update:sortOrder', props.sortOrder === 'asc' ? 'desc' : 'asc');
}
</script>

<template>
    <div class="flex items-center gap-2">
        <!-- Uncontrolled input: value is NOT bound back from the prop so typing
             is never interrupted by a reactive update cycle. -->
        <IconField class="flex-1">
            <InputIcon class="pi pi-search" />
            <InputText
                :placeholder="
                    searchPlaceholder ?? t('common.searchPlaceholder')
                "
                class="w-full"
                @input="onSearchInput"
            />
        </IconField>

        <!-- Sort field select -->
        <Select
            :model-value="orderBy"
            :options="sortOptions"
            option-label="label"
            option-value="value"
            class="w-44"
            @update:model-value="(v) => emit('update:orderBy', v)"
        />

        <!-- ASC / DESC toggle -->
        <Button
            :icon="
                sortOrder === 'asc'
                    ? 'pi pi-sort-amount-up-alt'
                    : 'pi pi-sort-amount-down-alt'
            "
            :aria-label="
                sortOrder === 'asc'
                    ? t('common.sortAscending')
                    : t('common.sortDescending')
            "
            severity="secondary"
            text
            @click="toggleSortOrder"
        />
    </div>
</template>
