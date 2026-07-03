<script setup lang="ts">
import type { z } from 'zod';
import type { zListUsersQuery } from '~~/server/orpc/generated/zod.gen';
import UserDataTable from './UserDataTable.vue';
import { useBreadcrumbStore } from '~~/app/store/breadcrumb';

type UsersQuery = z.infer<typeof zListUsersQuery>;
type OrderBy = UsersQuery['order_by'];

definePageMeta({ middleware: ['authenticated'], layout: 'base-layout' });

const { t } = useI18n();
const orpc = useNuxtApp().$orpc;
const breadcrumbStore = useBreadcrumbStore();

// ── Breadcrumb ──────────────────────────────────────────────────────────────

breadcrumbStore.set([{ label: t('nav.users') }]);

const page = ref(1);
const pageSize = ref(20);
const search = ref('');
const sortOrder = ref<'asc' | 'desc'>('desc');
const orderBy = ref<OrderBy>('last_activity');

const sortOptions: { label: string; value: OrderBy }[] = [
    { label: t('users.sortBy.name'), value: 'name' },
    { label: t('users.sortBy.email'), value: 'email' },
    { label: t('users.sortBy.created'), value: 'created' },
    { label: t('users.sortBy.activity'), value: 'last_activity' },
    { label: t('users.sortBy.role'), value: 'role' },
];

const queryInput = computed<UsersQuery>(() => ({
    page: page.value,
    page_size: pageSize.value,
    search: search.value || undefined,
    sort_order: sortOrder.value,
    order_by: orderBy.value,
}));

const { data, pending, error } = useLazyAsyncData(
    'users',
    () => orpc.users.list({ query: queryInput.value }),
    { watch: [queryInput] }
);

function onSearchChange(val: string) {
    search.value = val;
    page.value = 1;
}
</script>

<template>
    <BasePage :title="t('users.title')" :description="t('users.description')">
        <ListToolbar
            v-model:search="search"
            v-model:order-by="orderBy"
            v-model:sort-order="sortOrder"
            :sort-options="sortOptions"
            :search-placeholder="t('users.searchPlaceholder')"
            class="mb-3"
            @update:search="onSearchChange"
        />

        <UserDataTable
            :items="data?.data ?? []"
            :pending="pending"
            :error="error ?? null"
            :current-page="page"
            :page-size="pageSize"
            :total-count="data?.total_count ?? 0"
            :search="search"
            @update:current-page="(v: number) => (page = v)"
            @update:page-size="(v: number) => (pageSize = v)"
        />
    </BasePage>
</template>
