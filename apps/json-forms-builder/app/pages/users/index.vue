<script setup lang="ts">
import type { z } from 'zod';
import type { zListUsersQuery, zUser } from '~~/server/orpc/generated/zod.gen';
import { PhUsers, PhWarningCircle } from '@phosphor-icons/vue';

type UsersQuery = z.infer<typeof zListUsersQuery>;
type OrderBy = UsersQuery['order_by'];
type UserRow = z.infer<typeof zUser>;

definePageMeta({ middleware: ['authenticated'], layout: 'base-layout' });

const { t } = useI18n();
const orpc = useNuxtApp().$orpc;

// --- Query state ---
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

// --- Helpers ---
function initials(name: string): string {
    return name
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');
}

function roleBadgeVariant(role: string): string {
    return role === 'admin' ? 'danger' : 'secondary';
}

function onSearchChange(val: string) {
    search.value = val;
    page.value = 1;
}

function onPageChange(p: number) {
    page.value = p;
}

const totalPages = computed(() => data.value?.total_pages ?? 1);

// Skeleton rows for loading state
const SKELETON_ROWS = Array.from({ length: 5 }, (_, i) => i);
</script>

<template>
    <BasePage
        :title="t('users.title')"
        :description="
            data
                ? t('users.total', { n: data.total_count }, data.total_count)
                : undefined
        "
    >
        <!-- Toolbar -->
        <ListToolbar
            v-model:search="search"
            v-model:order-by="orderBy"
            v-model:sort-order="sortOrder"
            v-model:page-size="pageSize"
            :sort-options="sortOptions"
            :search-placeholder="t('users.searchPlaceholder')"
            :total-count="data?.total_count"
            class="mb-3"
            @update:search="onSearchChange"
        />

        <!-- Error -->
        <BAlert v-if="error" variant="danger" :dismissible="false" class="mb-3">
            <div class="d-flex align-items-center gap-2">
                <PhWarningCircle :size="18" />
                <strong>{{ t('users.loadError') }}</strong>
            </div>
            <p class="mb-0 mt-1">{{ error.message }}</p>
        </BAlert>

        <BCard>
            <BCardBody class="p-0">
                <!-- Skeleton loading -->
                <BTableSimple v-if="pending" class="mb-0">
                    <BThead>
                        <BTr>
                            <BTh>{{ t('users.columns.user') }}</BTh>
                            <BTh class="text-end" style="width: 8rem">
                                {{ t('users.columns.role') }}
                            </BTh>
                            <BTh class="text-end" style="width: 13rem">
                                {{ t('users.columns.activity') }}
                            </BTh>
                        </BTr>
                    </BThead>
                    <BTbody>
                        <BTr v-for="i in SKELETON_ROWS" :key="i">
                            <BTd>
                                <div class="d-flex align-items-center gap-3">
                                    <span
                                        class="placeholder rounded-circle d-inline-block flex-shrink-0"
                                        style="width: 40px; height: 40px"
                                    ></span>
                                    <div class="d-flex flex-column gap-1">
                                        <BPlaceholder
                                            style="
                                                width: 8rem;
                                                height: 0.875rem;
                                            "
                                        />
                                        <BPlaceholder
                                            style="
                                                width: 10rem;
                                                height: 0.75rem;
                                            "
                                        />
                                    </div>
                                </div>
                            </BTd>
                            <BTd class="text-end">
                                <BPlaceholder
                                    class="rounded-pill"
                                    style="width: 4rem; height: 1.25rem"
                                />
                            </BTd>
                            <BTd class="text-end">
                                <div
                                    class="d-flex flex-column gap-1 align-items-end"
                                >
                                    <BPlaceholder
                                        style="width: 7rem; height: 0.75rem"
                                    />
                                    <BPlaceholder
                                        style="width: 7rem; height: 0.75rem"
                                    />
                                </div>
                            </BTd>
                        </BTr>
                    </BTbody>
                </BTableSimple>

                <!-- Empty state -->
                <div v-else-if="data && data.data.length === 0" class="p-4">
                    <EmptyState
                        :icon="PhUsers"
                        :title="t('users.noUsersTitle')"
                        :description="
                            search
                                ? t('users.noSearchResults', { query: search })
                                : t('users.noUsersDescription')
                        "
                    />
                </div>

                <!-- Data table -->
                <BTableSimple v-else-if="data" class="mb-0">
                    <BThead>
                        <BTr>
                            <BTh>{{ t('users.columns.user') }}</BTh>
                            <BTh class="text-end" style="width: 8rem">
                                {{ t('users.columns.role') }}
                            </BTh>
                            <BTh class="text-end" style="width: 13rem">
                                {{ t('users.columns.activity') }}
                            </BTh>
                        </BTr>
                    </BThead>
                    <BTbody>
                        <BTr
                            v-for="row in data.data as UserRow[]"
                            :key="row.id"
                        >
                            <BTd>
                                <div class="d-flex align-items-center gap-3">
                                    <span
                                        class="d-inline-flex align-items-center justify-content-center rounded-circle fw-semibold small flex-shrink-0 text-primary-emphasis"
                                        style="
                                            width: 40px;
                                            height: 40px;
                                            background-color: var(
                                                --bs-primary-bg-subtle
                                            );
                                        "
                                    >
                                        {{ initials(row.name) }}
                                    </span>
                                    <div class="d-flex flex-column">
                                        <span class="fw-medium">{{
                                            row.name
                                        }}</span>
                                        <span class="small text-secondary">{{
                                            row.email
                                        }}</span>
                                    </div>
                                </div>
                            </BTd>
                            <BTd class="text-end">
                                <span
                                    :class="
                                        'badge bg-' + roleBadgeVariant(row.role)
                                    "
                                    class="text-capitalize"
                                >
                                    {{ row.role }}
                                </span>
                            </BTd>
                            <BTd class="text-end small text-secondary">
                                <ClientOnly>
                                    <div class="d-flex flex-column">
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
                            </BTd>
                        </BTr>
                    </BTbody>
                </BTableSimple>
            </BCardBody>
        </BCard>

        <!-- Pagination -->
        <div
            v-if="data && totalPages > 1"
            class="d-flex justify-content-end mt-3"
        >
            <BPagination
                :model-value="page"
                :total-rows="data.total_count"
                :per-page="pageSize"
                @update:model-value="(v) => onPageChange(Number(v))"
            />
        </div>
    </BasePage>
</template>
