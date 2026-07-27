<script setup lang="ts" generic="T">
/**
 * TreeSelectNode — Recursive node renderer for TreeSelect.
 * Not meant to be used standalone.
 */

interface TreeNode<T = any> {
    id: number | string;
    label: string;
    data: T;
    children?: TreeNode<T>[] | null;
}

const props = defineProps<{
    node: TreeNode<T>;
    depth: number;
    expandedIds: Set<number | string>;
    selectedId: number | null;
    search: string;
}>();

const emit = defineEmits<{
    toggle: [id: number | string];
    select: [node: TreeNode<T>];
}>();

const INDENT = 20;
const hasChildren = computed(() => !!props.node.children?.length);
const isExpanded = computed(() => props.expandedIds.has(props.node.id));
const isSelected = computed(() => props.selectedId === Number(props.node.id));

function highlightLabel(label: string): string {
    if (!props.search) return label;
    // Simple bold highlighting — the template will use v-html for actual highlighting
    return label;
}
</script>

<template>
    <div class="tree-select-node">
        <!-- Node row -->
        <div
            class="tree-select-row d-flex align-items-center gap-1 py-1 rounded"
            :class="{ 'bg-primary bg-opacity-10': isSelected }"
            :style="{ paddingLeft: depth * INDENT + 4 + 'px' }"
            @click="emit('select', node)"
        >
            <!-- Expand toggle -->
            <span
                v-if="hasChildren"
                style="width: 16px; cursor: pointer"
                @click.stop="emit('toggle', node.id)"
            >
                <PhosphorIcon
                    :name="isExpanded ? 'caret-down' : 'caret-right'"
                />
            </span>
            <span v-else style="width: 16px" class="flex-shrink-0" />

            <!-- Folder icon -->
            <PhosphorIcon name="folder" />

            <!-- Label -->
            <span
                class="small text-truncate"
                :class="{ 'fw-semibold': isSelected }"
            >
                {{ node.label }}
            </span>
        </div>

        <!-- Children -->
        <template v-if="hasChildren && isExpanded">
            <TreeSelectNode
                v-for="child in node.children"
                :key="child.id"
                :node="child"
                :depth="depth + 1"
                :expanded-ids="expandedIds"
                :selected-id="selectedId"
                :search="search"
                @toggle="(id) => emit('toggle', id)"
                @select="(n) => emit('select', n)"
            />
        </template>
    </div>
</template>

<style scoped>
/* .tree-select-row {
    transition: background-color 0.1s;
} */
.tree-select-row:hover {
    background-color: var(--bs-light-bg-subtle, rgba(0, 0, 0, 0.04));
}
</style>
