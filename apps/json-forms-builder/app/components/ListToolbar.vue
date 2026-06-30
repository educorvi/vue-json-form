<script setup lang="ts" generic="T extends string">
import {
    PhMagnifyingGlass,
    PhSortAscending,
    PhSortDescending,
} from '@phosphor-icons/vue';

const props = defineProps<{
    search: string;
    orderBy: T;
    sortOrder: 'asc' | 'desc';
    pageSize: number;
    sortOptions: { label: string; value: T }[];
    pageSizeOptions?: number[];
    searchPlaceholder?: string;
    totalCount?: number;
}>();

const emit = defineEmits<{
    'update:search': [value: string];
    'update:orderBy': [value: T];
    'update:sortOrder': [value: 'asc' | 'desc'];
    'update:pageSize': [value: number];
}>();

const { t } = useI18n();

const sizes = props.pageSizeOptions ?? [10, 20, 50, 100];

let debounceTimer: ReturnType<typeof setTimeout>;

function onSearchInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => emit('update:search', val), 400);
}

function toggleSortOrder() {
    emit('update:sortOrder', props.sortOrder === 'asc' ? 'desc' : 'asc');
}
</script>

<template>
    <div class="d-flex flex-column gap-2">
        <div class="d-flex flex-wrap align-items-center gap-2">
            <!-- Search -->
            <BInputGroup class="flex-grow-1" style="max-width: 24rem">
                <BInputGroupText>
                    <PhMagnifyingGlass :size="16" />
                </BInputGroupText>
                <BFormInput
                    :placeholder="
                        searchPlaceholder ?? t('common.searchPlaceholder')
                    "
                    @input="onSearchInput"
                />
            </BInputGroup>

            <!-- Sort by select -->
            <BFormSelect
                :model-value="orderBy"
                :options="sortOptions"
                text-field="label"
                value-field="value"
                class="w-auto"
                style="min-width: 10rem"
                @update:model-value="(v) => emit('update:orderBy', v as T)"
            />

            <!-- Sort order toggle -->
            <BButton
                variant="outline-secondary"
                :title="
                    sortOrder === 'asc'
                        ? t('common.sortAscending')
                        : t('common.sortDescending')
                "
                @click="toggleSortOrder"
            >
                <PhSortAscending v-if="sortOrder === 'asc'" :size="16" />
                <PhSortDescending v-else :size="16" />
            </BButton>

            <!-- Page size -->
            <BInputGroup class="w-auto">
                <BInputGroupText class="small">{{
                    t('common.perPage')
                }}</BInputGroupText>
                <BFormSelect
                    :model-value="pageSize"
                    :options="
                        sizes.map((s) => ({ label: String(s), value: s }))
                    "
                    text-field="label"
                    value-field="value"
                    class="w-auto"
                    style="min-width: 5rem"
                    @update:model-value="
                        (v) => emit('update:pageSize', Number(v))
                    "
                />
            </BInputGroup>
        </div>

        <!-- Total count -->
        <small v-if="totalCount !== undefined" class="text-secondary">
            {{ t('common.totalCount', { n: totalCount }, totalCount) }}
        </small>
    </div>
</template>
