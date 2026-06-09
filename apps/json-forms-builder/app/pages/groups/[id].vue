<script setup lang="ts">
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';

definePageMeta({ middleware: ['authenticated'], layout: 'default' });

const { t } = useI18n();
const route = useRoute();
const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;

const groupId = computed(() => String(route.params.id));

const { data: group, error: groupError } = useLazyAsyncData(
    `group-${groupId.value}`,
    () => orpc.groups.get({ params: { id: groupId.value } })
);

// Build breadcrumb from parent_path + current group
const breadcrumbItems = computed(() => {
    const items: { label: string; route?: string }[] = [
        { label: t('groups.title'), route: '/groups' },
    ];
    if (group.value?.parent_path) {
        for (const entry of group.value.parent_path) {
            if (entry.id) {
                items.push({ label: entry.name, route: `/groups/${entry.id}` });
            }
        }
    }
    if (group.value) {
        items.push({
            label:
                group.value.title || group.value.name || `#${group.value.id}`,
        });
    }
    return items;
});

// Children list
const childPage = ref(1);
const childPageSize = ref(10);
const search = ref('');
const sortOrder = ref<'asc' | 'desc'>('asc');
const childOrderBy = ref<'title' | 'created'>('title');

const sortOptions = [
    { label: t('groups.sortBy.title'), value: 'title' as const },
    { label: t('groups.sortBy.created'), value: 'created' as const },
];

const {
    data: children,
    pending: childrenPending,
    error: childrenError,
} = useLazyAsyncData(
    `group-children-${groupId.value}`,
    () =>
        orpc.groups.listChildren({
            params: { id: groupId.value },
            query: {
                page: childPage.value,
                page_size: childPageSize.value,
                search: search.value,
                sort_order: sortOrder.value,
            },
        }),
    { watch: [childPage, search, sortOrder] }
);

function onPage(event: { page: number; rows: number }) {
    childPage.value = event.page + 1;
    childPageSize.value = event.rows;
}
</script>

<template>
    <PageWrapper>
        <!-- Breadcrumb -->
        <Breadcrumb
            :home="{ icon: 'pi pi-home', route: '/dashboard' }"
            :model="breadcrumbItems"
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

        <!-- Error loading group -->
        <Message
            v-if="groupError"
            severity="error"
            :closable="false"
            class="mb-4"
        >
            {{ groupError.message }}
        </Message>

        <!-- Header -->
        <div v-if="group" class="mb-6">
            <div class="flex items-start justify-between">
                <div>
                    <div class="flex items-center gap-3 mb-1">
                        <i class="pi pi-folder text-primary text-2xl" />
                        <h1
                            class="text-2xl font-bold text-surface-900 dark:text-surface-0"
                        >
                            {{ group.title || group.name }}
                        </h1>
                    </div>
                    <p
                        v-if="group.description"
                        class="text-surface-400 text-sm"
                    >
                        {{ group.description }}
                    </p>
                    <div class="flex gap-4 mt-2 text-xs text-surface-400">
                        <span
                            ><i class="pi pi-folder mr-1" />{{
                                group.group_count
                            }}
                            {{ t('groups.subGroups') }}</span
                        >
                        <span
                            ><i class="pi pi-file mr-1" />{{ group.form_count }}
                            {{ t('groups.forms') }}</span
                        >
                        <span
                            ><i class="pi pi-users mr-1" />{{
                                group.member_count
                            }}
                            {{ t('groups.members') }}</span
                        >
                    </div>
                </div>
                <NuxtLink :to="`/groups/new?parent=${groupId}`">
                    <Button
                        :label="t('groups.new.addSubGroup')"
                        icon="pi pi-plus"
                        size="small"
                    />
                </NuxtLink>
            </div>
        </div>

        <!-- Children search + sort -->
        <SearchFilter
            v-model:search="search"
            v-model:order-by="childOrderBy"
            v-model:sort-order="sortOrder"
            :sort-options="sortOptions"
            :search-placeholder="t('groups.searchChildrenPlaceholder')"
            class="mb-4"
            @update:search="childPage = 1"
        />

        <!-- Children card -->
        <Card>
            <template #content>
                <div v-if="childrenPending" class="flex flex-col gap-3 py-2">
                    <div
                        v-for="i in childPageSize"
                        :key="i"
                        class="flex items-center gap-3 px-3"
                    >
                        <Skeleton shape="circle" size="1.5rem" />
                        <Skeleton width="12rem" height="0.875rem" />
                    </div>
                </div>

                <template v-else>
                    <EmptyState
                        v-if="children && children.data.length === 0"
                        icon="pi pi-folder-open"
                        :title="t('groups.noChildrenTitle')"
                        :description="
                            search
                                ? t('groups.noSearchResults', { query: search })
                                : t('groups.noChildrenDescription')
                        "
                    />

                    <div
                        v-else-if="children"
                        class="divide-y divide-surface-100 dark:divide-surface-800"
                    >
                        <GroupItem
                            v-for="child in children.data"
                            :key="child.id"
                            :group="child as any"
                        />
                    </div>
                </template>

                <Message
                    v-if="childrenError"
                    severity="error"
                    :closable="false"
                    class="mt-2"
                >
                    {{ childrenError.message }}
                </Message>
            </template>
        </Card>

        <!-- Pagination -->
        <div
            v-if="children && children.total_pages > 1"
            class="mt-4 flex justify-end"
        >
            <Paginator
                :rows="childPageSize"
                :total-records="children.total_count"
                :first="(childPage - 1) * childPageSize"
                :rows-per-page-options="[10, 20, 50]"
                @page="onPage"
            />
        </div>
    </PageWrapper>
</template>
