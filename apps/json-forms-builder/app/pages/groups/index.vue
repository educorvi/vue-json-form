<script setup lang="ts">
import type { RouterClient } from '@orpc/server';
import type { z } from 'zod';
import type { zListGroupsQuery } from '~~/server/orpc/generated/zod.gen';
import type { AppRouter } from '~~/server/orpc/routers';

type GroupsQuery = z.infer<typeof zListGroupsQuery>;
type OrderBy = GroupsQuery['order_by'];

definePageMeta({ middleware: ['authenticated'], layout: 'default' });

const { t } = useI18n();
const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;

const page = ref(1);
const pageSize = ref(10);
const search = ref('');
const sortOrder = ref<'asc' | 'desc'>('asc');
const orderBy = ref<OrderBy>('title');

const sortOptions: { label: string; value: OrderBy }[] = [
    { label: t('groups.sortBy.title'), value: 'title' },
    { label: t('groups.sortBy.created'), value: 'created' },
    { label: t('groups.sortBy.updated'), value: 'updated' },
    { label: t('groups.sortBy.members'), value: 'member_count' },
];

const queryInput = computed<GroupsQuery>(() => ({
    page: page.value,
    page_size: pageSize.value,
    search: search.value,
    sort_order: sortOrder.value,
    order_by: orderBy.value,
}));

const { data, pending, error } = useLazyAsyncData(
    'groups',
    () => orpc.groups.list({ query: queryInput.value }),
    { watch: [queryInput] }
);

function onPage(event: { page: number; rows: number }) {
    page.value = event.page + 1;
    pageSize.value = event.rows;
}
</script>

<template>
    <PageWrapper>
        <!-- Breadcrumb -->
        <Breadcrumb
            :home="{ icon: 'pi pi-home', route: '/dashboard' }"
            :model="[{ label: t('groups.title') }]"
            class="mb-4 px-0"
        >
            <template #item="{ item }">
                <NuxtLink
                    v-if="item.route"
                    :to="item.route"
                    class="no-underline text-surface-600 dark:text-surface-300 hover:underline text-sm"
                >
                    {{ item.label }}
                </NuxtLink>
                <span
                    v-else
                    class="text-sm font-medium text-surface-800 dark:text-surface-100"
                    >{{ item.label }}</span
                >
            </template>
        </Breadcrumb>

        <!-- Header -->
        <div class="flex items-end justify-between mb-6">
            <div>
                <h1
                    class="text-2xl font-bold text-surface-900 dark:text-surface-0"
                >
                    {{ t('groups.title') }}
                </h1>
                <p v-if="data" class="text-sm text-surface-400 mt-0.5">
                    {{
                        t(
                            'groups.total',
                            { n: data.total_count },
                            data.total_count
                        )
                    }}
                </p>
            </div>
            <NuxtLink to="/groups/new">
                <Button
                    :label="t('groups.new.title')"
                    icon="pi pi-plus"
                    size="small"
                />
            </NuxtLink>
        </div>

        <!-- Search + sort -->
        <SearchFilter
            v-model:search="search"
            v-model:order-by="orderBy"
            v-model:sort-order="sortOrder"
            :sort-options="sortOptions"
            :search-placeholder="t('groups.searchPlaceholder')"
            class="mb-4"
            @update:search="page = 1"
        />

        <!-- Error banner -->
        <Message v-if="error" severity="error" class="mb-4" :closable="false">
            <span class="font-semibold">{{ t('groups.loadError') }}</span>
            {{ error.message }}
        </Message>

        <!-- Groups tree card -->
        <Card>
            <template #content>
                <!-- Skeleton -->
                <div v-if="pending" class="flex flex-col gap-3 py-2">
                    <div
                        v-for="i in pageSize"
                        :key="i"
                        class="flex items-center gap-3 px-3"
                    >
                        <Skeleton shape="circle" size="1.5rem" />
                        <Skeleton width="12rem" height="0.875rem" />
                        <Skeleton
                            class="ml-auto"
                            width="5rem"
                            height="0.75rem"
                        />
                    </div>
                </div>

                <template v-else>
                    <!-- Empty state -->
                    <EmptyState
                        v-if="data && data.data.length === 0"
                        icon="pi pi-folder-open"
                        :title="t('groups.noGroupsTitle')"
                        :description="
                            search
                                ? t('groups.noSearchResults', { query: search })
                                : t('groups.noGroupsDescription')
                        "
                    />

                    <!-- Expandable group tree -->
                    <div
                        v-else-if="data"
                        class="divide-y divide-surface-100 dark:divide-surface-800"
                    >
                        <GroupItem
                            v-for="group in data.data"
                            :key="group.id"
                            :group="group as any"
                        />
                    </div>
                </template>
            </template>
        </Card>

        <!-- Pagination -->
        <div v-if="data && data.total_pages > 1" class="mt-4 flex justify-end">
            <Paginator
                :rows="pageSize"
                :total-records="data.total_count"
                :first="(page - 1) * pageSize"
                :rows-per-page-options="[10, 20, 50]"
                @page="onPage"
            />
        </div>
    </PageWrapper>
</template>
