<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        currentPage: number;
        pageSize: number;
        totalCount: number;
        pageSizeOptions?: number[];
    }>(),
    {
        pageSizeOptions: () => [10, 20, 50, 100],
    }
);

const emit = defineEmits<{
    'update:currentPage': [value: number];
    'update:pageSize': [value: number];
}>();

const { t } = useI18n();

const startEntry = computed(() => (props.currentPage - 1) * props.pageSize + 1);
const endEntry = computed(() =>
    Math.min(props.currentPage * props.pageSize, props.totalCount)
);

const pageSizeSelectOptions = computed(() =>
    props.pageSizeOptions.map((s) => ({ label: String(s), value: s }))
);
</script>

<template>
    <div
        class="d-flex flex-wrap align-items-center justify-content-between gap-3"
    >
        <!-- Entry range text — wraps first on small screens -->
        <small class="text-secondary text-nowrap">
            {{
                t(
                    'common.showingEntries',
                    {
                        start: startEntry,
                        end: endEntry,
                        total: totalCount,
                    },
                    totalCount
                )
            }}
        </small>

        <!-- Pagination — always centered, grows to push flanks apart -->
        <BPagination
            :model-value="currentPage"
            :total-rows="totalCount"
            :per-page="pageSize"
            :limit="7"
            first-number
            last-number
            size="sm"
            class="mb-0"
            @update:model-value="
                (v: number | string) => emit('update:currentPage', Number(v))
            "
        />

        <!-- Page size selector — wraps last on small screens -->
        <BFormSelect
            :model-value="pageSize"
            :options="pageSizeSelectOptions"
            text-field="label"
            value-field="value"
            size="sm"
            class="w-auto small"
            style="min-width: 5rem"
            :title="t('common.pageSizeLabel')"
            @update:model-value="
                (v: unknown) => emit('update:pageSize', Number(v))
            "
        />
    </div>
</template>
