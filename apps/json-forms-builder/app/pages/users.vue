<script setup lang="ts">
import type { RouterClient } from '@orpc/server';
import type { z } from 'zod';
import type { zListUsersQuery } from '~~/server/orpc/generated/zod.gen';
import type { AppRouter } from '~~/server/orpc/routers';

type UsersQuery = z.infer<typeof zListUsersQuery>;

definePageMeta({ middleware: ['authenticated'], layout: 'default' });

const { t } = useI18n();
const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;

type OrderBy = UsersQuery['order_by'];

const page = ref(1);
const pageSize = ref(20);
const search = ref('');
const sortOrder = ref<'asc' | 'desc'>('desc');
const orderBy = ref<OrderBy>('last_activity');

const queryInput = computed<UsersQuery>(() => ({
    page: page.value,
    page_size: pageSize.value,
    search: search.value,
    sort_order: sortOrder.value,
    order_by: orderBy.value,
}));

const { data, pending, error } = await useAsyncData(
    'users',
    () => orpc.users.list({ query: queryInput.value }),
    { watch: [queryInput] }
);

function onPage(event: { page: number; rows: number }) {
    page.value = event.page + 1;
    pageSize.value = event.rows;
}

let searchTimer: ReturnType<typeof setTimeout>;
function onSearch(value: string) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        search.value = value;
        page.value = 1;
    }, 500);
}

const ROLE_SEVERITY: Record<string, 'danger' | 'secondary'> = {
    admin: 'danger',
    user: 'secondary',
};

const columns = computed(() => [
    { field: 'name', header: t('users.columns.name') },
    { field: 'email', header: t('users.columns.email') },
]);
</script>

<template>
    <div class="p-6">
        <div class="max-w-6xl mx-auto">
            <!-- Header row -->
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h1
                        class="text-2xl font-bold text-surface-900 dark:text-surface-0"
                    >
                        {{ t('users.title') }}
                    </h1>
                    <p v-if="data" class="text-sm text-surface-400 mt-0.5">
                        {{
                            $t('users.total', data.total_count, {
                                n: data.total_count,
                            })
                        }}
                    </p>
                </div>
                <!-- Search -->
                <div class="w-72">
                    <IconField>
                        <InputIcon class="pi pi-search" />
                        <InputText
                            :placeholder="t('users.searchPlaceholder')"
                            class="w-full"
                            @input="
                                onSearch(
                                    ($event.target as HTMLInputElement).value
                                )
                            "
                        />
                    </IconField>
                </div>
            </div>

            <!-- Error banner -->
            <Message
                v-if="error"
                severity="error"
                class="mb-4"
                :closable="false"
            >
                <span class="font-semibold">{{ t('users.loadError') }}</span>
                {{ error.message }}
            </Message>

            <!-- Table card -->
            <Card>
                <template #content>
                    <!-- Loading skeleton -->
                    <DataTable
                        v-if="pending"
                        :value="Array(pageSize).fill({})"
                        class="w-full"
                    >
                        <Column :header="t('users.columns.name')"
                            ><template #body
                                ><Skeleton height="1rem" /></template
                        ></Column>
                        <Column :header="t('users.columns.email')"
                            ><template #body
                                ><Skeleton height="1rem" /></template
                        ></Column>
                        <Column :header="t('users.columns.role')"
                            ><template #body
                                ><Skeleton
                                    width="4rem"
                                    height="1.25rem"
                                    border-radius="9999px" /></template
                        ></Column>
                        <Column :header="t('users.columns.created')">
                            <template #body>
                                <Skeleton height="1rem" />
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
                                    ? t('users.noSearchResults', {
                                          query: search,
                                      })
                                    : t('users.noUsersDescription')
                            "
                        />
                        <!-- Data table -->
                        <DataTable
                            v-else-if="data"
                            :value="data.data"
                            class="w-full"
                            striped-rows
                        >
                            <Column
                                v-for="col in columns"
                                :key="col.field"
                                :field="col.field"
                                :header="col.header"
                                sortable
                            ></Column>
                            <Column
                                field="role"
                                :header="t('users.columns.role')"
                            >
                                <template #body="{ data: row }">
                                    <Tag
                                        :value="row.role"
                                        :severity="
                                            ROLE_SEVERITY[row.role] ??
                                            'secondary'
                                        "
                                        class="capitalize"
                                    />
                                </template>
                            </Column>
                            <Column
                                field="created"
                                :header="t('users.columns.created')"
                            >
                                <template #body="{ data: row }">
                                    <span class="text-surface-500 text-sm">
                                        {{
                                            new Date(
                                                row.created
                                            ).toLocaleDateString()
                                        }}
                                    </span>
                                </template>
                            </Column>
                        </DataTable>
                    </template>
                </template>
            </Card>

            <!-- Pagination -->
            <div
                v-if="data && data.total_pages > 1"
                class="mt-4 flex justify-end"
            >
                <Paginator
                    :rows="pageSize"
                    :total-records="data.total_count"
                    :first="(page - 1) * pageSize"
                    :rows-per-page-options="[10, 20, 50, 100]"
                    @page="onPage"
                />
            </div>
        </div>
    </div>
</template>
