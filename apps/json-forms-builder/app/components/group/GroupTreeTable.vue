<script setup lang="ts">
/**
 * GroupTreeTable — Recursively expandable group tree.
 *
 * Each row can be expanded to lazily fetch & show immediate children.
 * Children are paginated. Works at root level and inside detail groups.
 */
import type { z } from 'zod';
import type { zGroup } from '~~/server/orpc/generated/zod.gen';
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';

type GroupRow = z.infer<typeof zGroup>;

interface ChildrenState {
    items: GroupRow[];
    loading: boolean;
    error: string | null;
    loaded: boolean;
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

const props = withDefaults(
    defineProps<{
        items: GroupRow[];
        depth?: number;
    }>(),
    { depth: 0 }
);

const emit = defineEmits<{
    edit: [group: GroupRow];
    delete: [group: GroupRow];
    navigate: [group: GroupRow];
}>();

const { t } = useI18n();
const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;

const INDENT_PX = 24;

// ── Children state — reactive record keyed by group id ────────────────────
// Using a plain ref<Record> so Vue tracks nested property mutations.
const childrenState = ref<Record<number, ChildrenState>>({});

function emptyState(): ChildrenState {
    return {
        items: [],
        loading: false,
        error: null,
        loaded: false,
        page: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 0,
    };
}

function ensureState(id: number): ChildrenState {
    if (!childrenState.value[id]) {
        childrenState.value[id] = emptyState();
    }
    return childrenState.value[id];
}

async function fetchChildren(group: GroupRow) {
    const st = ensureState(group.id);
    st.loading = true;
    st.error = null;

    try {
        const result = await orpc.groups.listChildren({
            params: { id: String(group.id) },
            query: {
                page: st.page,
                page_size: st.pageSize,
                sort_order: 'asc',
            },
        });
        st.items = (result.data as GroupRow[]) ?? [];
        st.totalCount = (result as any).total_count ?? st.items.length;
        st.totalPages = (result as any).total_pages ?? 1;
        st.loaded = true;
    } catch (err: any) {
        st.error = err?.message ?? String(err);
    } finally {
        st.loading = false;
    }
}

// ── Expanded set ──────────────────────────────────────────────────────────
const expandedIds = ref(new Set<number>());

function isExpanded(id: number): boolean {
    return expandedIds.value.has(id);
}

function onToggle(group: GroupRow) {
    if (isExpanded(group.id)) {
        expandedIds.value.delete(group.id);
        expandedIds.value = new Set(expandedIds.value);
    } else {
        expandedIds.value.add(group.id);
        expandedIds.value = new Set(expandedIds.value);
        fetchChildren(group);
    }
}

function onChildPageChange(group: GroupRow, newPage: number) {
    const st = ensureState(group.id);
    st.page = newPage;
    fetchChildren(group);
}

// ── Helpers ───────────────────────────────────────────────────────────────

function groupLink(group: GroupRow): string {
    const segments: string[] = [];
    if (group.parent_path) {
        for (const entry of group.parent_path) {
            segments.push(entry.path_segment ?? entry.name);
        }
    }
    segments.push(group.name ?? String(group.id));
    return `/groups/${encodeGroupPath(segments.join('/'))}`;
}

function formatTimestamp(iso: string | undefined): string {
    if (!iso) return '';
    const date = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(date);
}
</script>

<template>
    <div class="group-tree-table">
        <div v-for="group in items" :key="group.id" class="group-tree-node">
            <!-- Group row -->
            <div
                class="d-flex align-items-center gap-1 py-2 px-2 border-bottom"
                :style="{ paddingLeft: depth * INDENT_PX + 12 + 'px' }"
            >
                <!-- Expand toggle -->
                <BButton
                    v-if="group.group_count > 0"
                    variant="link"
                    class="text-secondary p-0 lh-1"
                    :aria-label="
                        isExpanded(group.id)
                            ? t('common.collapse')
                            : t('common.expand')
                    "
                    @click.stop="onToggle(group)"
                >
                    <PhosphorIcon
                        :name="
                            isExpanded(group.id) ? 'caret-down' : 'caret-right'
                        "
                    />
                </BButton>
                <span v-else class="flex-shrink-0" style="width: 18px" />

                <!-- Folder icon -->
                <PhosphorIcon name="folder" class="flex-shrink-0" />

                <!-- Title -->
                <div class="flex-grow-1 min-w-0">
                    <NuxtLink
                        :to="groupLink(group)"
                        class="fw-medium text-decoration-none text-body"
                    >
                        {{ group.title || group.name }}
                    </NuxtLink>
                </div>

                <!-- Right side: stats with timestamps below + actions -->
                <div class="d-flex align-items-center gap-2 flex-shrink-0">
                    <!-- Stats & timestamps column -->
                    <div class="d-flex flex-column align-items-end gap-0">
                        <GroupStatsBadge
                            :group-count="group.group_count"
                            :form-count="group.form_count"
                            :member-count="group.member_count"
                        />
                        <span
                            v-if="group.updated_by?.timestamp"
                            v-b-tooltip.hover
                            :title="t('groups.updated')"
                            class="d-inline-flex align-items-center gap-1 text-secondary mt-1"
                            style="font-size: 0.75rem; cursor: help"
                        >
                            <PhosphorIcon name="clock" :size="12" />
                            {{ formatTimestamp(group.updated_by.timestamp) }}
                        </span>
                    </div>

                    <!-- Actions -->
                    <BDropdown
                        variant="link"
                        no-caret
                        toggle-class="text-secondary p-0 border-0"
                    >
                        <template #button-content>
                            <PhosphorIcon name="dots-three" :size="18" />
                        </template>
                        <BDropdownItem @click="emit('edit', group)">
                            <PhosphorIcon name="pencil" />
                            {{ t('common.edit') }}
                        </BDropdownItem>
                        <BDropdownItem @click="emit('delete', group)">
                            <PhosphorIcon name="trash" />
                            {{ t('groups.delete.title') }}
                        </BDropdownItem>
                    </BDropdown>
                </div>
            </div>

            <!-- Expanded children -->
            <div
                v-if="isExpanded(group.id)"
                class="group-tree-children"
                :style="{ marginLeft: INDENT_PX + 'px' }"
            >
                <!-- Loading -->
                <div
                    v-if="childrenState[group.id]?.loading"
                    class="d-flex align-items-center gap-2 py-2 px-3 text-secondary small"
                >
                    <BSpinner small />
                    {{ t('common.loading') }}
                </div>

                <!-- Error -->
                <BAlert
                    v-else-if="childrenState[group.id]?.error"
                    variant="danger"
                    class="m-2"
                    :dismissible="false"
                >
                    {{ childrenState[group.id]?.error }}
                </BAlert>

                <!-- Empty -->
                <div
                    v-else-if="
                        childrenState[group.id]?.loaded &&
                        childrenState[group.id]!.items.length === 0
                    "
                    class="py-2 px-3 text-secondary small"
                >
                    {{ t('groups.noSubGroups') }}
                </div>

                <!-- Recursive tree + paginator -->
                <template v-else-if="childrenState[group.id]?.loaded">
                    <GroupTreeTable
                        :items="childrenState[group.id]!.items"
                        :depth="depth + 1"
                        @edit="(g) => emit('edit', g)"
                        @delete="(g) => emit('delete', g)"
                        @navigate="(g) => emit('navigate', g)"
                    />

                    <div
                        v-if="childrenState[group.id]!.totalPages > 1"
                        class="px-3 py-2"
                    >
                        <ListPaginator
                            :current-page="childrenState[group.id]!.page"
                            :page-size="childrenState[group.id]!.pageSize"
                            :total-count="childrenState[group.id]!.totalCount"
                            @update:current-page="
                                (v: number) => onChildPageChange(group, v)
                            "
                            @update:page-size="
                                (v: number) => {
                                    const st = ensureState(group.id);
                                    st.pageSize = v;
                                    st.page = 1;
                                    fetchChildren(group);
                                }
                            "
                        />
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>
