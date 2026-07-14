<script setup lang="ts">
/**
 * /groups — Root-level groups list.
 *
 * Uses the same patterns as /users:
 * - ListToolbar for search + sort
 * - ListDataContainer for stale-while-revalidate & delayed skeleton
 * - ListPaginator for pagination
 *
 * Groups are displayed in an expandable tree via GroupTreeTable.
 */
import type { z } from 'zod';
import type { zListGroupsQuery } from '~~/server/orpc/generated/zod.gen';
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';
type GroupsQuery = z.infer<typeof zListGroupsQuery>;
type OrderBy = GroupsQuery['order_by'];

definePageMeta({ middleware: ['authenticated'], layout: 'base-layout' });

const { t } = useI18n();
const router = useRouter();
const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;

// ── Breadcrumb ──────────────────────────────────────────────────────────────

useAppBreadcrumb().set('groups');

// ── Query state ──────────────────────────────────────────────────────────────
const page = ref(1);
const pageSize = ref(20);
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
    search: search.value || undefined,
    sort_order: sortOrder.value,
    order_by: orderBy.value,
}));

const { data, pending, error } = useLazyAsyncData(
    'groups',
    () => orpc.groups.list({ query: queryInput.value }),
    { watch: [queryInput] }
);

function onSearchChange(val: string) {
    search.value = val;
    page.value = 1;
}

// ── Delete modal ─────────────────────────────────────────────────────────────
const deleteTarget = ref<any>(null);
const showDeleteModal = ref(false);
const deletePending = ref(false);
const deleteError = ref<string | null>(null);

function onDelete(item: any) {
    deleteTarget.value = item;
    showDeleteModal.value = true;
}

async function onDeleteConfirm(item: any) {
    deletePending.value = true;
    deleteError.value = null;
    try {
        await orpc.groups.update({
            params: { id: String(item.id) },
            body: {
                title: item.title ?? item.name ?? '',
                created_by: null as any,
                updated_by: null as any,
            },
        });
        showDeleteModal.value = false;
        deleteTarget.value = null;
        refreshNuxtData('groups');
    } catch (err: any) {
        deleteError.value = err?.message ?? String(err);
    } finally {
        deletePending.value = false;
    }
}

function onEdit(item: any) {
    const path = buildGroupUrlPath(
        item.parent_path,
        item.name ?? String(item.id)
    );
    router.push(Routes.groupsEdit(path));
}

function onNavigate(item: any) {
    const path = buildGroupUrlPath(
        item.parent_path,
        item.name ?? String(item.id)
    );
    router.push(Routes.groupsDetail(path));
}

// ── Description ─────────────────────────────────────────────────────────────
const pageDescription = computed(() => {
    if (data.value?.total_count != null) {
        return t(
            'groups.total',
            { n: data.value.total_count },
            data.value.total_count
        );
    }
    return undefined;
});
</script>

<template>
    <BasePage
        :title="t('groups.title')"
        :description="pageDescription"
        icon="tree-structure"
    >
        <template #actions>
            <BButton variant="primary" size="sm" :to="Routes.GROUPS_NEW">
                <PhosphorIcon name="plus" :size="14" class="me-1" />
                {{ t('groups.new.title') }}
            </BButton>
        </template>

        <!-- Toolbar: search + sort -->
        <ListToolbar
            v-model:search="search"
            v-model:order-by="orderBy"
            v-model:sort-order="sortOrder"
            :sort-options="sortOptions"
            :search-placeholder="t('groups.searchPlaceholder')"
            class="mb-3"
            @update:search="onSearchChange"
        />

        <!-- Data container: handles skeleton / error / empty -->
        <ListDataContainer
            :items="data?.data ?? []"
            :pending="pending"
            :error="error ?? null"
            v-slot="{
                items: stableItems,
                showSkeleton,
                isEmpty,
                hasError,
                errorMessage,
            }"
        >
            <!-- Error -->
            <BAlert
                v-if="hasError"
                variant="danger"
                :dismissible="false"
                class="mb-3"
            >
                <div class="d-flex align-items-center gap-2">
                    <PhosphorIcon name="warning-circle" />
                    <strong>{{ t('groups.loadError') }}</strong>
                </div>
                <p class="mb-0 mt-1">{{ errorMessage }}</p>
            </BAlert>

            <BCard v-else>
                <BCardBody class="p-0">
                    <!-- Skeleton -->
                    <BPlaceholderTable
                        v-if="showSkeleton"
                        :columns="1"
                        :rows="5"
                        animation="glow"
                    >
                        <template #thead>
                            <BTr>
                                <BTh>{{ t('groups.columns.group') }}</BTh>
                            </BTr>
                        </template>
                    </BPlaceholderTable>

                    <!-- Empty -->
                    <div v-else-if="isEmpty" class="p-4">
                        <EmptyState
                            icon="folder-open"
                            :title="t('groups.noGroupsTitle')"
                            :description="
                                search
                                    ? t('groups.noSearchResults', {
                                          query: search,
                                      })
                                    : t('groups.noGroupsDescription')
                            "
                        />
                    </div>

                    <!-- Tree table -->
                    <GroupTreeTable
                        v-else
                        :items="stableItems"
                        @edit="onEdit"
                        @delete="onDelete"
                        @navigate="onNavigate"
                    />
                </BCardBody>

                <!-- Paginator -->
                <div
                    v-if="!showSkeleton && !isEmpty && data"
                    class="px-3 pb-3 pt-2"
                >
                    <ListPaginator
                        :current-page="page"
                        :page-size="pageSize"
                        :total-count="data.total_count"
                        @update:current-page="(v: number) => (page = v)"
                        @update:page-size="(v: number) => (pageSize = v)"
                    />
                </div>
            </BCard>
        </ListDataContainer>

        <!-- Delete confirmation modal -->
        <ConfirmTypingDelete
            v-if="deleteTarget"
            v-model="showDeleteModal"
            :title="t('groups.delete.title')"
            :warning="t('groups.delete.warning')"
            :item-name="deleteTarget?.title ?? deleteTarget?.name ?? ''"
            :confirm-label="t('groups.delete.confirm')"
            :cancel-label="t('common.cancel')"
            :pending="deletePending"
            :error="deleteError"
            @confirm="onDeleteConfirm(deleteTarget!)"
        />
    </BasePage>
</template>
