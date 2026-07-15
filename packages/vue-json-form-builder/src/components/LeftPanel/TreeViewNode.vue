<script setup lang="ts">
import { ref } from 'vue';
import { useFormStore } from '@/stores/formStore';
import type { TreeNode } from '@/components/LeftPanel/TreeViewPanel.vue';

const props = defineProps<{
    node: TreeNode;
}>();

const store = useFormStore();
const expanded = ref(true);

function select() {
    store.selectElement(props.node.id);
}
</script>

<template>
    <div>
        <div
            class="d-flex align-items-center gap-1 py-1 px-2 rounded small"
            :style="{
                paddingLeft: `${node.depth * 14 + 8}px`,
                cursor: 'pointer',
            }"
            :class="
                store.selectedElementId === node.id
                    ? 'text-primary fw-medium'
                    : 'text-body'
            "
            @click="select"
        >
            <button
                v-if="node.children !== undefined"
                class="btn btn-sm p-0 border-0 text-body flex-shrink-0"
                style="width: 1rem; height: 1rem; line-height: 1"
                @click.stop="expanded = !expanded"
            >
                <i
                    :class="expanded ? 'ph ph-caret-down' : 'ph ph-caret-right'"
                    class="text-xs"
                />
            </button>
            <span v-else style="width: 1rem" class="flex-shrink-0" />
            <i :class="node.icon" class="text-xs flex-shrink-0 opacity-50" />
            <span class="text-truncate text-xs flex-grow-1">{{
                node.label
            }}</span>
            <span class="ms-auto text-xs text-muted flex-shrink-0">{{
                node.type
            }}</span>
        </div>

        <div v-if="node.children && expanded">
            <TreeViewNode
                v-for="child in node.children"
                :key="child.id"
                :node="child"
            />
            <div
                v-if="node.children.length === 0"
                class="text-xs text-muted fst-italic py-1"
                :style="{ paddingLeft: `${(node.depth + 1) * 14 + 8}px` }"
            >
                Empty
            </div>
        </div>
    </div>
</template>
