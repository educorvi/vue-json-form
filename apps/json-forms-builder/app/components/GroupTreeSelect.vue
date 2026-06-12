<script setup lang="ts">
/**
 * GroupTreeSelect — wraps PrimeVue TreeSelect to let the user pick a group
 * from the full hierarchy.
 *
 * v-model: number | null  (selected group ID)
 *
 * The component fetches the hierarchy from the backend once on mount and
 * converts it to PrimeVue TreeNode objects. When a group is selected, the
 * full ancestor chain is shown as a mini breadcrumb below the selector.
 */
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';
import type { TreeNode } from 'primevue/treenode';

const props = defineProps<{
    modelValue: number | null;
    /** If provided, a "Use current folder" button appears. */
    currentGroupId?: number | null;
    /** Optional placeholder text override. */
    placeholder?: string;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: number | null];
}>();

const { t } = useI18n();
const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;

// ── Hierarchy data ──────────────────────────────────────────────────────────

const { data: hierarchy, pending } = useLazyAsyncData(
    'group-hierarchy-tree',
    () => orpc.groups.hierarchy({})
);

// ── Convert hierarchy nodes to PrimeVue TreeNode format ─────────────────────

interface HierarchyNode {
    id: number;
    name: string;
    title: string;
    children?: HierarchyNode[] | null;
}

// Also store a flat map from node key → TreeNode for quick ancestor lookup
interface TreeNodeRecord extends TreeNode {
    data: { id: number; name: string; title: string };
    children?: TreeNodeRecord[];
}

function toTreeNodes(nodes: HierarchyNode[]): TreeNodeRecord[] {
    return nodes.map((n) => ({
        key: String(n.id),
        label: n.title,
        data: { id: n.id, name: n.name, title: n.title },
        icon: 'pi pi-folder',
        children: n.children ? toTreeNodes(n.children) : undefined,
        leaf: !n.children || n.children.length === 0,
    }));
}

const treeNodes = computed<TreeNodeRecord[]>(() =>
    hierarchy.value ? toTreeNodes(hierarchy.value as HierarchyNode[]) : []
);

// ── Ancestor lookup helpers ──────────────────────────────────────────────────

/**
 * Walk the tree recursively to find the ancestor chain (root → leaf) for a
 * given node key. Returns the chain of TreeNode records, or empty array if
 * the key is not found.
 */
function findAncestorChain(
    nodes: TreeNodeRecord[],
    targetKey: string
): TreeNodeRecord[] {
    for (const node of nodes) {
        if (node.key === targetKey) {
            return [node];
        }
        if (node.children && node.children.length > 0) {
            const found = findAncestorChain(
                node.children as TreeNodeRecord[],
                targetKey
            );
            if (found.length > 0) {
                return [node, ...found];
            }
        }
    }
    return [];
}

const ancestorChain = ref<TreeNodeRecord[]>([]);

function updateAncestorChain(selectedId: number | null) {
    if (selectedId == null || !treeNodes.value.length) {
        ancestorChain.value = [];
        return;
    }
    ancestorChain.value = findAncestorChain(
        treeNodes.value,
        String(selectedId)
    );
}

// ── Selection — PrimeVue TreeSelect uses Record<string,boolean> internally ──

const selectedKeys = ref<Record<string, boolean> | null>(
    props.modelValue != null ? { [String(props.modelValue)]: true } : null
);

// Initial ancestor chain
if (props.modelValue != null) {
    updateAncestorChain(props.modelValue);
}

// Keep selectedKeys in sync when parent changes modelValue
watch(
    () => props.modelValue,
    (id) => {
        selectedKeys.value = id != null ? { [String(id)]: true } : null;
        updateAncestorChain(id);
    }
);

function onSelectionChange(keys: Record<string, boolean> | null) {
    selectedKeys.value = keys;
    if (!keys) {
        emit('update:modelValue', null);
        return;
    }
    const id = Object.keys(keys)[0];
    const numericId = id ? parseInt(id, 10) : null;
    emit('update:modelValue', numericId);
}

function useCurrentFolder() {
    if (props.currentGroupId != null) {
        emit('update:modelValue', props.currentGroupId);
        selectedKeys.value = { [String(props.currentGroupId)]: true };
    }
}

function clearSelection() {
    selectedKeys.value = null;
    emit('update:modelValue', null);
}
</script>

<template>
    <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
            <TreeSelect
                v-model="selectedKeys"
                :options="treeNodes"
                :loading="pending"
                :placeholder="placeholder ?? t('groups.treeSelect.placeholder')"
                filter
                filterMode="lenient"
                class="flex-1"
                @update:model-value="onSelectionChange"
            />
            <Button
                v-if="currentGroupId != null"
                :label="t('groups.treeSelect.useCurrentFolder')"
                icon="pi pi-map-marker"
                size="small"
                outlined
                @click="useCurrentFolder"
            />
            <Button
                v-if="modelValue != null"
                icon="pi pi-times"
                size="small"
                text
                rounded
                severity="secondary"
                :aria-label="t('common.clear')"
                @click="clearSelection"
            />
        </div>

        <!-- Hierarchy breadcrumb for selected parent -->
        <template v-if="ancestorChain.length > 0">
            <div
                class="mt-2 pt-2 border-t border-surface-100 dark:border-surface-800"
            >
                <div
                    class="flex items-center gap-1.5 text-xs text-surface-600 dark:text-surface-400"
                >
                    <i
                        class="pi pi-folder-open text-primary text-sm shrink-0"
                    />
                    <template
                        v-for="(entry, idx) in ancestorChain"
                        :key="entry.key"
                    >
                        <span
                            class="font-medium truncate max-w-[12ch]"
                            :title="entry.label"
                        >
                            {{ entry.label }}
                        </span>
                        <i
                            v-if="idx < ancestorChain.length - 1"
                            class="pi pi-angle-right text-[10px] text-surface-300 dark:text-surface-600 shrink-0"
                        />
                    </template>
                </div>
            </div>
        </template>
    </div>
</template>
