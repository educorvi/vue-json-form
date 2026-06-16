<script setup lang="ts">
import type { RouterClient } from '@orpc/server';
import type { z } from 'zod';
import type { zListUsersQuery } from '~~/server/orpc/generated/zod.gen';
import type { AppRouter } from '~~/server/orpc/routers';

type UsersQuery = z.infer<typeof zListUsersQuery>;
type OrderBy = UsersQuery['order_by'];

definePageMeta({ middleware: ['authenticated'], layout: 'default' });

const { t } = useI18n();
const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;

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
    search: search.value,
    sort_order: sortOrder.value,
    order_by: orderBy.value,
}));

const { data, pending, error } = useLazyAsyncData(
    'users',
    () => orpc.users.list({ query: queryInput.value }),
    { watch: [queryInput] }
);

function onPage(event: { page: number; rows: number }) {
    page.value = event.page + 1;
    pageSize.value = event.rows;
}

function initials(name: string): string {
    return name
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');
}

const ROLE_SEVERITY: Record<string, 'danger' | 'secondary'> = {
    admin: 'danger',
    user: 'secondary',
};
</script>

<template>
    <PageWrapper>
        <div class="flex items-end justify-between mb-6">
            <div>
                <h1
                    class="text-2xl font-bold text-surface-900 dark:text-surface-0"
                >
                    {{ t('users.title') }}
                </h1>
                <p v-if="data" class="text-sm text-surface-400 mt-0.5">
                    {{
                        t(
                            'users.total',
                            { n: data.total_count },
                            data.total_count
                        )
                    }}
                </p>
            </div>
        </div>

        <SearchFilter
            v-model:search="search"
            v-model:order-by="orderBy"
            v-model:sort-order="sortOrder"
            :sort-options="sortOptions"
            :search-placeholder="t('users.searchPlaceholder')"
            class="mb-4"
            @update:search="page = 1"
        />

        <Message v-if="error" severity="error" class="mb-4" :closable="false">
            <span class="font-semibold">{{ t('users.loadError') }}</span>
            {{ error.message }}
        </Message>

        <Card>
            <template #content>
                <DataTable
                    v-if="pending"
                    :value="Array(pageSize).fill({})"
                    class="w-full"
                >
                    <Column :header="t('users.columns.user')">
                        <template #body>
                            <div class="flex items-center gap-3">
                                <Skeleton shape="circle" size="2.5rem" />
                                <div class="flex flex-col gap-1">
                                    <Skeleton width="8rem" height="0.875rem" />
                                    <Skeleton width="10rem" height="0.75rem" />
                                </div>
                            </div>
                        </template>
                    </Column>
                    <Column :header="t('users.columns.role')">
                        <template #body>
                            <Skeleton
                                width="4rem"
                                height="1.25rem"
                                border-radius="9999px"
                            />
                        </template>
                    </Column>
                    <Column :header="t('users.columns.activity')">
                        <template #body>
                            <div class="flex flex-col gap-1">
                                <Skeleton width="7rem" height="0.75rem" />
                                <Skeleton width="7rem" height="0.75rem" />
                            </div>
                        </template>
                    </Column>
                </DataTable>

                <template v-else>
                    <EmptyState
                        v-if="data && data.data.length === 0"
                        icon="pi pi-users"
                        :title="t('users.noUsersTitle')"
                        :description="
                            search
                                ? t('users.noSearchResults', { query: search })
                                : t('users.noUsersDescription')
                        "
                    />

                    <DataTable
                        v-else-if="data"
                        :value="data.data"
                        class="w-full"
                    >
                        <Column :header="t('users.columns.user')">
                            <template #body="{ data: row }">
                                <div class="flex items-center gap-3">
                                    <Avatar
                                        :label="initials(row.name)"
                                        shape="circle"
                                        class="flex-shrink-0 font-semibold bg-primary-100 text-primary-700 dark:bg-primary-800 dark:text-primary-200"
                                    />
                                    <div class="flex flex-col leading-tight">
                                        <span
                                            class="font-medium text-surface-800 dark:text-surface-100"
                                            >{{ row.name }}</span
                                        >
                                        <span
                                            class="text-xs text-surface-400"
                                            >{{ row.email }}</span
                                        >
                                    </div>
                                </div>
                            </template>
                        </Column>

                        <Column
                            :header="t('users.columns.role')"
                            style="width: 8rem"
                        >
                            <template #body="{ data: row }">
                                <Tag
                                    :value="row.role"
                                    :severity="
                                        ROLE_SEVERITY[row.role] ?? 'secondary'
                                    "
                                    class="capitalize"
                                />
                            </template>
                        </Column>

                        <Column
                            :header="t('users.columns.activity')"
                            style="width: 13rem"
                        >
                            <template #body="{ data: row }">
                                <ClientOnly>
                                    <div
                                        class="flex flex-col leading-tight text-xs text-surface-400"
                                    >
                                        <span
                                            >{{ t('users.created') }}
                                            {{
                                                new Date(
                                                    row.created
                                                ).toLocaleDateString()
                                            }}</span
                                        >
                                        <span
                                            >{{ t('users.lastActivity') }}
                                            {{
                                                new Date(
                                                    row.updated
                                                ).toLocaleDateString()
                                            }}</span
                                        >
                                    </div>
                                </ClientOnly>
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </template>
        </Card>

        <div v-if="data && data.total_pages > 1" class="mt-4 flex justify-end">
            <Paginator
                :rows="pageSize"
                :total-records="data.total_count"
                :first="(page - 1) * pageSize"
                :rows-per-page-options="[10, 20, 50, 100]"
                @page="onPage"
            />
        </div>
    </PageWrapper>
</template>
