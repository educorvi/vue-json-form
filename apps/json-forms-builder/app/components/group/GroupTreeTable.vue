<script setup lang="ts">
/**
 * GroupTreeTable — Recursively expandable tree for groups and forms.
 *
 * Items can be either groups (type='group') or forms (type='form').
 * Groups are expandable to show their children; forms link to their detail page.
 * Children are lazily fetched when expanding a group.
 */
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';

interface ChildItem {
    id: number;
    type?: 'group' | 'form';
    [key: string]: any;
}

interface ChildrenState {
    items: ChildItem[];
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
        items: ChildItem[];
        depth?: number;
    }>(),
    { depth: 0 }
);

const emit = defineEmits<{
    edit: [item: ChildItem];
    delete: [item: ChildItem];
    navigate: [item: ChildItem];
}>();

const { t } = useI18n();
const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;
const router = useRouter();

const INDENT_PX = 24;

// ── Children state (groups only — forms have no children) ─────────────────
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

async function fetchChildren(group: ChildItem) {
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
        st.items = (result.data as ChildItem[]) ?? [];
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

function onToggle(item: ChildItem) {
    if (isExpanded(item.id)) {
        expandedIds.value.delete(item.id);
        expandedIds.value = new Set(expandedIds.value);
    } else {
        expandedIds.value.add(item.id);
        expandedIds.value = new Set(expandedIds.value);
        fetchChildren(item);
    }
}

function onChildPageChange(item: ChildItem, newPage: number) {
    const st = ensureState(item.id);
    st.page = newPage;
    fetchChildren(item);
}

// ── Helpers ───────────────────────────────────────────────────────────────

function formatTimestamp(iso: string | undefined): string {
    if (!iso) return '';
    const date = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(date);
}

function isGroup(item: ChildItem): boolean {
    return item.type !== 'form';
}

function isForm(item: ChildItem): boolean {
    return item.type === 'form';
}

function itemLink(item: ChildItem): string {
    return Routes.childItemPath(item);
}
</script>

<template>
    <div class="group-tree-table">
        <div
            v-for="item in items"
            :key="`${item.type}-${item.id}`"
            class="group-tree-node"
        >
            <!-- ── Group row ──────────────────────────────────────────── -->
            <div
                v-if="isGroup(item)"
                class="d-flex align-items-center gap-1 py-2 px-2 border-bottom"
                :style="{ paddingLeft: depth * INDENT_PX + 12 + 'px' }"
            >
                <!-- Expand toggle -->
                <BButton
                    v-if="item.group_count > 0 || item.form_count > 0"
                    variant="link"
                    class="text-secondary p-0 lh-1"
                    :aria-label="
                        isExpanded(item.id)
                            ? t('common.collapse')
                            : t('common.expand')
                    "
                    @click.stop="onToggle(item)"
                >
                    <PhosphorIcon
                        :name="
                            isExpanded(item.id) ? 'caret-down' : 'caret-right'
                        "
                    />
                </BButton>
                <span v-else class="flex-shrink-0" style="width: 18px" />

                <!-- Folder icon -->
                <PhosphorIcon name="folder" class="flex-shrink-0" />

                <!-- Title -->
                <div class="flex-grow-1 min-w-0">
                    <NuxtLink
                        :to="itemLink(item)"
                        class="fw-medium text-decoration-none text-body"
                    >
                        {{ item.title || item.name }}
                    </NuxtLink>
                </div>

                <!-- Right side: stats + timestamp + actions -->
                <div class="d-flex align-items-center gap-2 flex-shrink-0">
                    <div class="d-flex flex-column align-items-end gap-0">
                        <GroupStatsBadge
                            :group-count="item.group_count"
                            :form-count="item.form_count"
                            :member-count="item.member_count"
                        />
                        <span
                            class="d-inline-flex align-items-center gap-1 text-secondary mt-1"
                            style="font-size: 0.75rem"
                            v-b-tooltip="t('groups.updated')"
                        >
                            <PhosphorIcon name="clock" :size="12" />
                            {{ formatTimestamp(item.updated_by.timestamp) }}
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
                        <BDropdownItem @click="emit('edit', item)">
                            <PhosphorIcon name="pencil" />
                            {{ t('common.edit') }}
                        </BDropdownItem>
                        <BDropdownItem @click="emit('delete', item)">
                            <PhosphorIcon name="trash" />
                            {{ t('groups.delete.title') }}
                        </BDropdownItem>
                    </BDropdown>
                </div>
            </div>

            <!-- ── Form row ───────────────────────────────────────────── -->
            <div
                v-else
                class="d-flex align-items-center gap-2 py-2 px-2 border-bottom form-row"
                :style="{ paddingLeft: depth * INDENT_PX + 12 + 'px' }"
            >
                <!-- File icon -->
                <PhosphorIcon
                    name="file-text"
                    class="flex-shrink-0 text-secondary"
                />

                <!-- Title -->
                <div class="flex-grow-1 min-w-0">
                    <NuxtLink
                        :to="itemLink(item)"
                        class="fw-medium text-decoration-none text-body"
                    >
                        {{ item.title }}
                    </NuxtLink>
                    <div
                        v-if="item.description"
                        class="text-secondary small text-truncate"
                    >
                        {{ item.description }}
                    </div>
                </div>

                <!-- Timestamp -->
                <span
                    class="text-secondary small text-nowrap flex-shrink-0 d-none d-sm-block"
                >
                    <PhosphorIcon name="clock" :size="12" />
                    {{ formatTimestamp(item.updated_by?.timestamp) }}
                </span>

                <!-- Actions -->
                <BDropdown
                    variant="link"
                    no-caret
                    toggle-class="text-secondary p-0 border-0"
                >
                    <template #button-content>
                        <PhosphorIcon name="dots-three" :size="18" />
                    </template>
                    <BDropdownItem @click="emit('edit', item)">
                        <PhosphorIcon name="pencil" />
                        {{ t('common.edit') }}
                    </BDropdownItem>
                    <BDropdownItem @click="emit('delete', item)">
                        <PhosphorIcon name="trash" />
                        {{ t('forms.delete.title') }}
                    </BDropdownItem>
                </BDropdown>
            </div>

            <!-- ── Expanded group children ────────────────────────────── -->
            <div
                v-if="isGroup(item) && isExpanded(item.id)"
                class="group-tree-children"
                :style="{ marginLeft: INDENT_PX + 'px' }"
            >
                <!-- Loading -->
                <div
                    v-if="childrenState[item.id]?.loading"
                    class="d-flex align-items-center gap-2 py-2 px-3 text-secondary small"
                >
                    <BSpinner small />
                    {{ t('common.loading') }}
                </div>

                <!-- Error -->
                <BAlert
                    v-else-if="childrenState[item.id]?.error"
                    variant="danger"
                    class="m-2"
                    :dismissible="false"
                >
                    {{ childrenState[item.id]?.error }}
                </BAlert>

                <!-- Empty -->
                <div
                    v-else-if="
                        childrenState[item.id]?.loaded &&
                        childrenState[item.id]!.items.length === 0
                    "
                    class="py-2 px-3 text-secondary small"
                >
                    {{ t('groups.noSubGroups') }}
                </div>

                <!-- Recursive tree + paginator -->
                <template v-else-if="childrenState[item.id]?.loaded">
                    <GroupTreeTable
                        :items="childrenState[item.id]!.items"
                        :depth="depth + 1"
                        @edit="(g: any) => emit('edit', g)"
                        @delete="(g: any) => emit('delete', g)"
                        @navigate="(g: any) => emit('navigate', g)"
                    />

                    <div
                        v-if="childrenState[item.id]!.totalPages > 1"
                        class="px-3 py-2"
                    >
                        <ListPaginator
                            :current-page="childrenState[item.id]!.page"
                            :page-size="childrenState[item.id]!.pageSize"
                            :total-count="childrenState[item.id]!.totalCount"
                            @update:current-page="
                                (v: number) => onChildPageChange(item, v)
                            "
                            @update:page-size="
                                (v: number) => {
                                    const st = ensureState(item.id);
                                    st.pageSize = v;
                                    st.page = 1;
                                    fetchChildren(item);
                                }
                            "
                        />
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<style scoped>
.form-row:hover {
    background-color: var(--bs-light-bg-subtle, rgba(0, 0, 0, 0.04));
}
</style>
