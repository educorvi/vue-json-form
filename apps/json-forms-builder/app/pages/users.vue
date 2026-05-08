<script setup lang="ts">
import type { UsersQuery } from '~~/server/models/user';
import type { AppRouter } from '~~/server/trpc/routers';
import { createTRPCNuxtClient } from 'trpc-nuxt/client';

definePageMeta({ middleware: ['authenticated'] });

const trpc = useNuxtApp().$trpc as unknown as ReturnType<
    typeof createTRPCNuxtClient<AppRouter>
>;

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
    () => trpc.users.list.query(queryInput.value),
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
    }, 300);
}

const ROLE_SEVERITY: Record<string, 'danger' | 'secondary'> = {
    admin: 'danger',
    user: 'secondary',
};

const columns = [
    { field: 'firstname', header: 'First name' },
    { field: 'lastname', header: 'Last name' },
    { field: 'email', header: 'Email' },
];
</script>

<template>
    <div class="min-h-screen bg-surface-50 dark:bg-surface-900 p-6">
        <div class="max-w-6xl mx-auto">
            <!-- Header row -->
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h1
                        class="text-2xl font-bold text-surface-900 dark:text-surface-0"
                    >
                        Users
                    </h1>
                    <p v-if="data" class="text-sm text-surface-400 mt-0.5">
                        {{ data.total_count }} user{{
                            data.total_count !== 1 ? 's' : ''
                        }}
                        total
                    </p>
                </div>
                <!-- Search -->
                <div class="w-72">
                    <IconField>
                        <InputIcon class="pi pi-search" />
                        <InputText
                            placeholder="Search by name or email…"
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
                <span class="font-semibold">Failed to load users:</span>
                {{ error.message }}
            </Message>

            <!-- Table card -->
            <div
                class="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 overflow-hidden shadow-sm"
            >
                <!-- Loading skeleton -->
                <DataTable
                    v-if="pending"
                    :value="Array(pageSize).fill({})"
                    class="w-full"
                >
                    <Column header="First name"
                        ><template #body><Skeleton height="1rem" /></template
                    ></Column>
                    <Column header="Last name"
                        ><template #body><Skeleton height="1rem" /></template
                    ></Column>
                    <Column header="Email"
                        ><template #body><Skeleton height="1rem" /></template
                    ></Column>
                    <Column header="Role"
                        ><template #body
                            ><Skeleton
                                width="4rem"
                                height="1.25rem"
                                border-radius="9999px" /></template
                    ></Column>
                    <Column header="Created"
                        ><template #body><Skeleton height="1rem" /></template
                    ></Column>
                </DataTable>

                <!-- Empty state -->
                <EmptyState
                    v-else-if="data && data.data.length === 0"
                    icon="pi pi-users"
                    title="No users found"
                    :description="
                        search
                            ? `No results for '${search}'. Try a different search term.`
                            : 'There are no users yet.'
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
                    <Column field="role" header="Role">
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
                    <Column field="created" header="Created">
                        <template #body="{ data: row }">
                            <span class="text-surface-500 text-sm">
                                {{ new Date(row.created).toLocaleDateString() }}
                            </span>
                        </template>
                    </Column>
                </DataTable>
            </div>

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
