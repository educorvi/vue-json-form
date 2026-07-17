<script setup lang="ts">
/**
 * BootstrapTreeNode.vue
 *
 * Recursive tree node component used by BootstrapTree.
 * Renders a single node with expand/collapse caret, icon, label, and a type badge.
 */
import { ref } from 'vue';

export interface BootstrapTreeItem {
    id: string;
    label: string;
    icon: string;
    type: string;
    children?: BootstrapTreeItem[];
    [key: string]: unknown;
}

const props = defineProps<{
    node: BootstrapTreeItem;
    depth: number;
    selectedId?: string | null;
}>();

const emit = defineEmits<{
    select: [id: string];
}>();

const expanded = ref(true);

function toggle() {
    expanded.value = !expanded.value;
}

function select() {
    emit('select', props.node.id);
}
</script>

<template>
    <div>
        <!-- Node row -->
        <div
            class="d-flex align-items-center gap-1 py-1 pe-2 rounded"
            :style="{ paddingLeft: `${depth * 12 + 6}px`, cursor: 'pointer' }"
            :class="
                selectedId === node.id
                    ? 'bg-primary-subtle text-primary fw-medium border border-primary'
                    : 'text-body'
            "
            style="border-width: 1.5px !important"
            @click="select"
        >
            <!-- Expand/collapse caret -->
            <button
                v-if="node.children?.length"
                class="btn btn-sm p-0 border-0 d-flex align-items-center justify-content-center flex-shrink-0"
                style="width: 1rem; height: 1rem"
                :class="selectedId === node.id ? 'text-primary' : 'text-body'"
                @click.stop="toggle"
            >
                <i
                    :class="
                        expanded
                            ? 'bi bi-caret-down-fill'
                            : 'bi bi-caret-right-fill'
                    "
                    style="font-size: 0.6rem"
                />
            </button>
            <span v-else style="width: 1rem" class="flex-shrink-0" />

            <!-- Icon -->
            <i
                :class="[node.icon, 'flex-shrink-0']"
                style="font-size: 0.75rem"
            />

            <!-- Label -->
            <span class="text-truncate text-xs flex-grow-1">{{
                node.label
            }}</span>

            <!-- Type badge -->
            <span
                class="badge rounded-pill fw-medium flex-shrink-0"
                :class="
                    selectedId === node.id
                        ? 'bg-primary text-white'
                        : 'bg-body-tertiary text-body-secondary'
                "
                style="font-size: 0.6rem; letter-spacing: 0.02em"
                >{{ node.type }}</span
            >
        </div>

        <!-- Children -->
        <div v-if="node.children?.length && expanded">
            <BootstrapTreeNode
                v-for="child in node.children"
                :key="child.id"
                :node="child"
                :depth="depth + 1"
                :selected-id="selectedId"
                @select="emit('select', $event)"
            />
        </div>
    </div>
</template>
