<script setup lang="ts">
/**
 * GroupTreeSelect — wraps PrimeVue TreeSelect to let the user pick a group
 * from the full hierarchy.
 *
 * v-model: number | null  (selected group ID)
 *
 * The component fetches the hierarchy from the backend once on mount and
 * converts it to PrimeVue TreeNode objects.
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

function toTreeNodes(nodes: HierarchyNode[]): TreeNode[] {
    return nodes.map((n) => ({
        key: String(n.id),
        label: n.title,
        data: { id: n.id, name: n.name, title: n.title },
        icon: 'pi pi-folder',
        children: n.children ? toTreeNodes(n.children) : undefined,
        leaf: !n.children || n.children.length === 0,
    }));
}

const treeNodes = computed<TreeNode[]>(() =>
    hierarchy.value ? toTreeNodes(hierarchy.value as HierarchyNode[]) : []
);

// ── Selection — PrimeVue TreeSelect uses Record<string,boolean> internally ──

// We maintain a separate "selected node" object to extract label for display
const selectedKeys = ref<Record<string, boolean> | null>(
    props.modelValue != null ? { [String(props.modelValue)]: true } : null
);

// Keep selectedKeys in sync when parent changes modelValue
watch(
    () => props.modelValue,
    (id) => {
        selectedKeys.value = id != null ? { [String(id)]: true } : null;
    }
);

function onSelectionChange(keys: Record<string, boolean> | null) {
    selectedKeys.value = keys;
    if (!keys) {
        emit('update:modelValue', null);
        return;
    }
    const id = Object.keys(keys)[0];
    emit('update:modelValue', id ? parseInt(id, 10) : null);
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
    </div>
</template>
