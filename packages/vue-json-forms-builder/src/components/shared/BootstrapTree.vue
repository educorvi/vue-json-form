<script setup lang="ts">
/**
 * BootstrapTree.vue
 *
 * Generic tree component using Bootstrap styling.
 * Mimics PrimeVue Tree's behaviour with expand/collapse, selection, and badges.
 *
 * Usage:
 *   <BootstrapTree
 *     :nodes="treeData"
 *     :selected-id="selectedId"
 *     empty-text="No items"
 *     empty-icon="ph ph-archive"
 *     @select="onSelect"
 *   >
 *     <template #empty>
 *       Custom empty state content
 *     </template>
 *   </BootstrapTree>
 */
import BootstrapTreeNode, {
    type BootstrapTreeItem,
} from './BootstrapTreeNode.vue';

defineProps<{
    nodes: BootstrapTreeItem[];
    selectedId?: string | null;
    emptyText?: string;
    emptyIcon?: string;
}>();

const emit = defineEmits<{
    select: [id: string];
}>();
</script>

<template>
    <div>
        <div
            v-if="nodes.length === 0"
            class="text-center text-body-tertiary small py-4"
        >
            <slot name="empty">
                <i
                    v-if="emptyIcon"
                    :class="[emptyIcon, 'd-block mb-2']"
                    style="font-size: 1.5rem"
                />
                <span>{{ emptyText ?? 'No items' }}</span>
            </slot>
        </div>
        <BootstrapTreeNode
            v-for="node in nodes"
            v-else
            :key="node.id"
            :node="node"
            :depth="0"
            :selected-id="selectedId"
            @select="emit('select', $event)"
        />
    </div>
</template>
