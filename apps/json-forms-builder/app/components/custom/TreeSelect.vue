<script setup lang="ts" generic="T">
/**
 * TreeSelect — Generic hierarchical single-select dropdown built with Bootstrap components.
 *
 * v-model: the selected value (or null)
 * :nodes — array of TreeNode<T>
 *
 * Features:
 * - Search/filter box at top of dropdown
 * - Recursive tree rendering with expand/collapse
 * - Keyboard navigation (arrows, Enter, Escape)
 * - Click outside to close
 */
import { onClickOutside } from '@vueuse/core';

export interface TreeNode<T = any> {
    id: number | string;
    label: string;
    data: T;
    children?: TreeNode<T>[] | null;
}

// Nuxt can't auto-import generic SFCs, so import explicitly
import TreeSelectNode from './TreeSelectNode.vue';

const props = withDefaults(
    defineProps<{
        modelValue: number | null;
        nodes: TreeNode<T>[];
        placeholder?: string;
        loading?: boolean;
        /** Max-height of the dropdown content. Default 320px. */
        maxHeight?: string;
    }>(),
    { maxHeight: '320px' }
);

const emit = defineEmits<{
    'update:modelValue': [value: number | null];
}>();

const { t } = useI18n();

// ── Dropdown state ────────────────────────────────────────────────────────
const open = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);

onClickOutside(
    dropdownRef,
    () => {
        open.value = false;
    },
    { ignore: [triggerRef] }
);

// ── Search ────────────────────────────────────────────────────────────────
const search = ref('');

function matchesSearch(node: TreeNode<T>): boolean {
    if (!search.value) return true;
    const q = search.value.toLowerCase();
    return node.label.toLowerCase().includes(q);
}

// ── Expanded set ──────────────────────────────────────────────────────────
const expandedIds = ref(new Set<number | string>());

function isExpanded(id: number | string): boolean {
    return expandedIds.value.has(id);
}

function toggleExpand(id: number | string) {
    if (isExpanded(id)) {
        expandedIds.value.delete(id);
    } else {
        expandedIds.value.add(id);
    }
    expandedIds.value = new Set(expandedIds.value);
}

// ── Selection & breadcrumb path ──────────────────────────────────────────
const selectedPath = computed(() => {
    if (props.modelValue == null) return [];
    return findAncestorChain(props.nodes, props.modelValue);
});

function findAncestorChain(
    nodes: TreeNode<T>[],
    targetId: number | string
): TreeNode<T>[] {
    for (const node of nodes) {
        if (node.id === targetId) return [node];
        if (node.children?.length) {
            const found = findAncestorChain(node.children, targetId);
            if (found.length > 0) return [node, ...found];
        }
    }
    return [];
}

function findNodeById(
    nodes: TreeNode<T>[],
    id: number | string
): TreeNode<T> | null {
    for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children?.length) {
            const found = findNodeById(node.children, id);
            if (found) return found;
        }
    }
    return null;
}

function selectNode(node: TreeNode<T>) {
    emit('update:modelValue', Number(node.id));
    open.value = false;
    search.value = '';
}

function clearSelection() {
    emit('update:modelValue', null);
}

// ── Keyboard ──────────────────────────────────────────────────────────────
function onTriggerKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        open.value = true;
        nextTick(() => searchInput.value?.focus());
    }
}

// ── Filtered & rendered nodes ─────────────────────────────────────────────
// Recursively filter nodes; keep parents if any child matches.
function filterNodes(nodes: TreeNode<T>[]): TreeNode<T>[] {
    if (!search.value) return nodes;
    return nodes
        .map((n) => {
            const childMatch = n.children?.length
                ? filterNodes(n.children)
                : [];
            if (matchesSearch(n) || childMatch.length > 0) {
                return {
                    ...n,
                    children: childMatch.length ? childMatch : n.children,
                };
            }
            return null;
        })
        .filter(Boolean) as TreeNode<T>[];
}

const filteredNodes = computed(() => filterNodes(props.nodes));

// Auto-expand all when searching
watch(search, (val) => {
    if (val) {
        // Expand all nodes while searching
        const expandAll = (nodes: TreeNode<T>[]) => {
            for (const n of nodes) {
                expandedIds.value.add(n.id);
                if (n.children?.length) expandAll(n.children);
            }
        };
        expandedIds.value = new Set();
        expandAll(props.nodes);
        expandedIds.value = new Set(expandedIds.value);
    } else {
        expandedIds.value = new Set();
    }
});
</script>

<template>
    <div class="tree-select" ref="dropdownRef">
        <!-- Trigger button -->
        <BButton
            ref="triggerRef"
            variant="outline-secondary"
            class="w-100 d-flex align-items-center justify-content-between"
            :class="{ 'border-primary': open }"
            @click="open = !open"
            @keydown="onTriggerKeydown"
        >
            <div
                class="d-flex align-items-center gap-2"
                style="min-width: 0; overflow: hidden"
            >
                <template v-if="selectedPath.length > 0">
                    <span
                        class="d-inline-flex align-items-center gap-1"
                        style="min-width: 0; overflow: hidden"
                    >
                        <PhosphorIcon name="folder" />
                        <template
                            v-for="(entry, idx) in selectedPath"
                            :key="entry.id"
                        >
                            <span class="text-body text-nowrap">{{
                                entry.label
                            }}</span>
                            <PhosphorIcon
                                v-if="idx < selectedPath.length - 1"
                                name="caret-right"
                                :size="10"
                                class="text-secondary flex-shrink-0"
                            />
                        </template>
                    </span>
                </template>
                <span v-else class="text-secondary text-truncate">
                    {{ placeholder ?? t('groups.treeSelect.placeholder') }}
                </span>
            </div>
            <div class="d-flex align-items-center gap-1 ms-2 flex-shrink-0">
                <BButton
                    v-if="modelValue != null"
                    variant="link"
                    size="sm"
                    class="text-secondary p-0 lh-1 border-0"
                    @click.stop="clearSelection"
                >
                    <PhosphorIcon name="x" />
                </BButton>
                <PhosphorIcon
                    :name="open ? 'caret-up' : 'caret-down'"
                    :size="14"
                    class="text-secondary"
                />
            </div>
        </BButton>

        <!-- Dropdown -->
        <div
            v-if="open"
            class="tree-select-dropdown border rounded bg-body shadow-sm mt-1"
        >
            <!-- Search -->
            <div class="px-2 pt-2">
                <BInputGroup size="sm">
                    <BInputGroupText>
                        <PhosphorIcon name="magnifying-glass" :size="14" />
                    </BInputGroupText>
                    <BFormInput
                        ref="searchInput"
                        v-model="search"
                        :placeholder="t('common.searchPlaceholder')"
                    />
                </BInputGroup>
            </div>

            <BDropdownDivider />

            <!-- Loading -->
            <div
                v-if="loading"
                class="px-3 py-2 text-center text-secondary small"
            >
                <BSpinner small />
                {{ t('common.loading') }}
            </div>

            <!-- No results -->
            <div
                v-else-if="filteredNodes.length === 0"
                class="px-3 py-2 text-center text-secondary small"
            >
                {{ t('groups.noSearchResults', { query: search }) }}
            </div>

            <!-- Tree nodes -->
            <div
                v-else
                class="tree-select-nodes px-1 pb-1"
                :style="{ maxHeight: maxHeight, overflowY: 'auto' }"
            >
                <template v-for="node in filteredNodes" :key="node.id">
                    <TreeSelectNode
                        :node="node"
                        :depth="0"
                        :expanded-ids="expandedIds"
                        :selected-id="modelValue"
                        :search="search"
                        @toggle="toggleExpand"
                        @select="selectNode"
                    />
                </template>
            </div>
        </div>
    </div>
</template>

<style scoped>
.tree-select {
    position: relative;
}
.tree-select-dropdown {
    position: absolute;
    left: 0;
    right: 0;
    z-index: 1050;
    min-width: 100%;
}
.tree-select-nodes::-webkit-scrollbar {
    width: 6px;
}
.tree-select-nodes::-webkit-scrollbar-thumb {
    background: var(--bs-border-color);
    border-radius: 3px;
}
</style>
