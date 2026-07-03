<script setup lang="ts" generic="T extends string">
const props = withDefaults(
    defineProps<{
        search: string;
        orderBy: T;
        sortOrder: 'asc' | 'desc';
        sortOptions: { label: string; value: T }[];
        searchPlaceholder?: string;
        /** Debounce delay in ms for search input. Default 400. */
        debounceMs?: number;
    }>(),
    { debounceMs: 400 }
);

const emit = defineEmits<{
    'update:search': [value: string];
    'update:orderBy': [value: T];
    'update:sortOrder': [value: 'asc' | 'desc'];
}>();

const { t } = useI18n();

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function emitSearch(val: string) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
    }
    emit('update:search', val);
}

function onSearchInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        debounceTimer = null;
        emit('update:search', val);
    }, props.debounceMs);
}

/** Enter key triggers search immediately (no debounce). */
function onSearchKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
        const val = (e.target as HTMLInputElement).value;
        emitSearch(val);
    }
}

function toggleSortOrder() {
    emit('update:sortOrder', props.sortOrder === 'asc' ? 'desc' : 'asc');
}
</script>

<template>
    <BRow>
        <!-- Search — takes remaining space -->
        <BCol>
            <BInputGroup>
                <BInputGroupText>
                    <!-- <PhMagnifyingGlass :size="16" /> -->
                    <PhosphorIcon name="magnifying-glass" />
                </BInputGroupText>
                <BFormInput
                    :placeholder="
                        searchPlaceholder ?? t('common.searchPlaceholder')
                    "
                    @input="onSearchInput"
                    @keydown="onSearchKeydown"
                />
            </BInputGroup>
        </BCol>

        <!-- Sort controls (inline, joined) -->
        <BCol sm="auto" class="mt-2 mt-sm-0">
            <BInputGroup>
                <BFormSelect
                    :model-value="orderBy"
                    :options="sortOptions"
                    text-field="label"
                    value-field="value"
                    @update:model-value="(v) => emit('update:orderBy', v as T)"
                />

                <BButton
                    variant="outline-secondary"
                    :title="
                        sortOrder === 'asc'
                            ? t('common.sortAscending')
                            : t('common.sortDescending')
                    "
                    @click="toggleSortOrder"
                >
                    <!-- <PhSortAscending v-if="sortOrder === 'asc'" :size="16" /> -->
                    <!-- <PhSortDescending v-else :size="16" /> -->
                    <PhosphorIcon
                        v-if="sortOrder === 'asc'"
                        name="sort-ascending"
                    />
                    <PhosphorIcon v-else name="sort-descending" />
                </BButton>
            </BInputGroup>
        </BCol>
    </BRow>
</template>
