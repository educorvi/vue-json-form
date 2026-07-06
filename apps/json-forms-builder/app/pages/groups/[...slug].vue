<script setup lang="ts">
/**
 * /groups/[...slug] — Group detail page.
 *
 * Shows group info header + searchable, paginated children list.
 * Children are rendered in an expandable GroupTreeTable (groups first).
 * TODO: Add forms rendering after groups once API supports it.
 */
import type { z } from 'zod';
import type {
    zGroup,
    zListGroupChildrenQuery,
} from '~~/server/orpc/generated/zod.gen';
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';
import { useBreadcrumbStore } from '~~/app/store/breadcrumb';

type GroupRow = z.infer<typeof zGroup>;
type ChildrenQuery = z.infer<typeof zListGroupChildrenQuery>;

definePageMeta({ middleware: ['authenticated'], layout: 'base-layout' });

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;
const breadcrumbStore = useBreadcrumbStore();

// ── Group slug ───────────────────────────────────────────────────────────────

const groupSlug = computed(() => {
    const slug = route.params.slug;
    if (Array.isArray(slug)) return slug.join('/');
    return slug || '';
});

const { data: group, error: groupError } = useLazyAsyncData(
    `group-${groupSlug.value}`,
    () => orpc.groups.get({ params: { id: groupSlug.value } })
);

// ── Breadcrumb — reactively rebuilt when group data arrives ─────────────────

watch(
    group,
    (g) => {
        const items: Array<{ label: string; route?: string }> = [
            { label: t('nav.groups'), route: '/groups' },
        ];

        // Add parent path entries as breadcrumb ancestors
        if (g?.parent_path) {
            const segments: string[] = [];
            for (const entry of (g as any).parent_path) {
                segments.push(entry.path_segment ?? entry.name);
                items.push({
                    label: entry.name,
                    route: `/groups/${encodeGroupPath(segments.join('/'))}`,
                });
            }
        }

        // Current group
        if (g) {
            items.push({
                label:
                    (g as any).title || (g as any).name || `#${(g as any).id}`,
            });
        }

        breadcrumbStore.set(items);
    },
    { immediate: true }
);

// ── 404 handling ─────────────────────────────────────────────────────────

const isNotFound = computed(() => {
    const err = groupError.value as any;
    return (
        err?.statusCode === 404 ||
        err?.status === 404 ||
        err?.code === 'NOT_FOUND'
    );
});

const childPage = ref(1);
const childPageSize = ref(20);
const search = ref('');
const sortOrder = ref<'asc' | 'desc'>('asc');
const childOrderBy = ref<'title' | 'created' | 'updated'>('title');

const sortOptions = [
    { label: t('groups.sortBy.title'), value: 'title' as const },
    { label: t('groups.sortBy.created'), value: 'created' as const },
    { label: t('groups.sortBy.updated'), value: 'updated' as const },
];

const {
    data: children,
    pending: childrenPending,
    error: childrenError,
} = useLazyAsyncData(
    `group-children-${groupSlug.value}`,
    () =>
        orpc.groups.listChildren({
            params: { id: groupSlug.value },
            query: {
                page: childPage.value,
                page_size: childPageSize.value,
                search: search.value || undefined,
                sort_order: sortOrder.value,
                order_by: childOrderBy.value,
            },
        }),
    { watch: [childPage, childPageSize, search, sortOrder, childOrderBy] }
);

function onSearchChange(val: string) {
    search.value = val;
    childPage.value = 1;
}

// ── Delete modal ─────────────────────────────────────────────────────────────
const deleteTarget = ref<GroupRow | null>(null);
const showDeleteModal = ref(false);
const deletePending = ref(false);

function onDelete(group: GroupRow) {
    deleteTarget.value = group;
    showDeleteModal.value = true;
}

async function onDeleteConfirm(group: GroupRow) {
    deletePending.value = true;
    try {
        // TODO: Replace with actual delete endpoint
        await orpc.groups.update({
            params: { id: String(group.id) },
            body: {
                title: group.title ?? group.name ?? '',
                created_by: null as any,
                updated_by: null as any,
            },
        });
        showDeleteModal.value = false;
        deleteTarget.value = null;
        refreshNuxtData(`group-children-${groupSlug.value}`);
        refreshNuxtData(`group-${groupSlug.value}`);
    } finally {
        deletePending.value = false;
    }
}

// ── Navigation ───────────────────────────────────────────────────────────────

function onEdit(group: GroupRow) {
    router.push(`/groups/${group.id}/edit`);
}

function onNavigate(group: GroupRow) {
    const segments: string[] = [];
    if (group.parent_path) {
        for (const entry of group.parent_path) {
            segments.push(entry.path_segment ?? entry.name);
        }
    }
    segments.push(group.name ?? String(group.id));
    router.push(`/groups/${encodeGroupPath(segments.join('/'))}`);
}

function editCurrentGroup() {
    if (group.value) {
        router.push(`/groups/${(group.value as any).id}/edit`);
    }
}
</script>

<template>
    <BasePage
        :title="
            group ? (group as any).title || (group as any).name || '' : '...'
        "
        :description="(group as any)?.description"
        icon="folder"
    >
        <template v-if="group" #actions>
            <BButton
                variant="outline-secondary"
                size="sm"
                @click="editCurrentGroup"
                class="me-2"
            >
                <PhosphorIcon name="pencil" :size="14" class="me-1" />
                {{ t('common.edit') }}
            </BButton>
            <BButton
                variant="primary"
                size="sm"
                :to="`/groups/new?parent=${(group as any).id}`"
            >
                <PhosphorIcon name="plus" :size="14" class="me-1" />
                {{ t('groups.new.addSubGroup') }}
            </BButton>
        </template>

        <!-- Group error / 404 -->
        <template v-if="groupError">
            <BAlert
                v-if="isNotFound"
                variant="warning"
                :dismissible="false"
                class="mb-3"
            >
                <div class="text-center py-3">
                    <PhosphorIcon
                        name="warning-circle"
                        :size="40"
                        class="text-warning mb-2"
                    />
                    <h4 class="mb-2">{{ t('groups.notFound') }}</h4>
                    <p class="text-secondary mb-3">
                        {{ (groupError as any)?.message }}
                    </p>
                    <BButton variant="primary" :to="'/groups'">
                        {{ t('groups.backToGroups') }}
                    </BButton>
                </div>
            </BAlert>
            <BAlert v-else variant="danger" :dismissible="false" class="mb-3">
                {{ (groupError as any)?.message }}
            </BAlert>
        </template>

        <!-- Loading skeleton for group -->
        <div v-else-if="!group" class="mb-4">
            <BPlaceholder animation="glow" class="mb-2" width="50%" />
            <BPlaceholder animation="glow" width="30%" />
        </div>

        <!-- Stats (below header, only when group is loaded) -->
        <GroupStatsBadge
            v-if="group"
            :group-count="(group as any).group_count"
            :form-count="(group as any).form_count"
            :member-count="(group as any).member_count"
            class="mb-3"
        />

        <!-- Children search + sort -->
        <ListToolbar
            v-model:search="search"
            v-model:order-by="childOrderBy"
            v-model:sort-order="sortOrder"
            :sort-options="sortOptions"
            :search-placeholder="t('groups.searchChildrenPlaceholder')"
            class="mb-3"
            @update:search="onSearchChange"
        />

        <!-- Children card -->
        <ListDataContainer
            :items="children?.data ?? []"
            :pending="childrenPending"
            :error="childrenError ?? null"
            v-slot="{
                items: stableChildren,
                showSkeleton,
                isEmpty: childrenEmpty,
                hasError: childrenHasError,
                errorMessage: childrenErrorMessage,
            }"
        >
            <!-- Error -->
            <BAlert
                v-if="childrenHasError"
                variant="danger"
                :dismissible="false"
                class="mb-3"
            >
                <div class="d-flex align-items-center gap-2">
                    <PhosphorIcon name="warning-circle" />
                    <strong>{{ t('groups.loadError') }}</strong>
                </div>
                <p class="mb-0 mt-1">{{ childrenErrorMessage }}</p>
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
                    <div v-else-if="childrenEmpty" class="p-4">
                        <EmptyState
                            icon="folder-open"
                            :title="t('groups.noChildrenTitle')"
                            :description="
                                search
                                    ? t('groups.noSearchResults', {
                                          query: search,
                                      })
                                    : t('groups.noChildrenDescription')
                            "
                        />
                    </div>

                    <!-- Children tree table -->
                    <GroupTreeTable
                        v-else
                        :items="stableChildren as GroupRow[]"
                        @edit="onEdit"
                        @delete="onDelete"
                        @navigate="onNavigate"
                    />
                </BCardBody>

                <!-- Paginator -->
                <div
                    v-if="!showSkeleton && !childrenEmpty && children"
                    class="px-3 pb-3 pt-2"
                >
                    <ListPaginator
                        :current-page="childPage"
                        :page-size="childPageSize"
                        :total-count="children.total_count"
                        @update:current-page="(v: number) => (childPage = v)"
                        @update:page-size="(v: number) => (childPageSize = v)"
                    />
                </div>
            </BCard>
        </ListDataContainer>

        <!-- Delete confirmation modal -->
        <GroupDeleteModal
            v-if="deleteTarget"
            v-model="showDeleteModal"
            :group="deleteTarget"
            :pending="deletePending"
            @confirm="onDeleteConfirm"
            @cancel="
                () => {
                    showDeleteModal = false;
                    deleteTarget = null;
                }
            "
        />
    </BasePage>
</template>
