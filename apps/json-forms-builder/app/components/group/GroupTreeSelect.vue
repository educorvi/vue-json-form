<script setup lang="ts">
/**
 * GroupTreeSelect — Fetches the full group hierarchy and presents it
 * as a searchable tree selector using the custom TreeSelect component.
 *
 * v-model: number | null  (selected group ID)
 *
 * Shows the full ancestor path as a breadcrumb below the selector
 * and a read-only computed URL path of the selected group.
 */
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';
import type { TreeNode } from '~~/app/components/custom/TreeSelect.vue';
import TreeSelect from '~~/app/components/custom/TreeSelect.vue';

interface HierarchyNode {
    id: number;
    name: string;
    title: string;
    children?: HierarchyNode[] | null;
}

const props = defineProps<{
    modelValue: number | null;
    /** If provided, a "Use current folder" button appears. */
    currentGroupId?: number | null;
    placeholder?: string;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: number | null];
}>();

const { t } = useI18n();
const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;

// ── Hierarchy data ────────────────────────────────────────────────────────

const { data: hierarchy, pending } = useLazyAsyncData(
    'group-hierarchy-tree',
    () => orpc.groups.hierarchy({})
);

function toTreeNodes(nodes: HierarchyNode[]): TreeNode<HierarchyNode>[] {
    return nodes.map((n) => ({
        id: n.id,
        label: n.title,
        data: n,
        children: n.children ? toTreeNodes(n.children) : undefined,
    }));
}

const treeNodes = computed<TreeNode<HierarchyNode>[]>(() =>
    hierarchy.value ? toTreeNodes(hierarchy.value as HierarchyNode[]) : []
);

// ── Ancestor chain / breadcrumb ───────────────────────────────────────────

interface AncestorEntry {
    id: number;
    name: string;
    title: string;
}

function findAncestors(
    nodes: TreeNode<HierarchyNode>[],
    targetId: number
): AncestorEntry[] {
    for (const node of nodes) {
        if (node.id === targetId) {
            return [
                {
                    id: Number(node.id),
                    name: node.data.name,
                    title: node.data.title,
                },
            ];
        }
        if (node.children?.length) {
            const found = findAncestors(node.children, targetId);
            if (found.length > 0) {
                return [
                    {
                        id: Number(node.id),
                        name: node.data.name,
                        title: node.data.title,
                    },
                    ...found,
                ];
            }
        }
    }
    return [];
}

const ancestorChain = computed(() => {
    if (props.modelValue == null || !treeNodes.value.length) return [];
    return findAncestors(treeNodes.value, props.modelValue);
});

// Computed slug path preview
const slugPathPreview = computed(() => {
    if (ancestorChain.value.length === 0) return '/';
    return '/' + ancestorChain.value.map((a) => a.name).join('/') + '/';
});

function useCurrentFolder() {
    if (props.currentGroupId != null) {
        emit('update:modelValue', props.currentGroupId);
    }
}
</script>

<template>
    <div>
        <BRow class="align-items-start g-2">
            <!-- Tree select -->
            <BCol>
                <TreeSelect
                    :model-value="modelValue"
                    :nodes="treeNodes"
                    :loading="pending"
                    :placeholder="
                        placeholder ?? t('groups.treeSelect.placeholder')
                    "
                    @update:model-value="
                        (v: number | null) => emit('update:modelValue', v)
                    "
                />
            </BCol>

            <!-- Use current folder button -->
            <BCol v-if="currentGroupId != null" sm="auto">
                <BTooltip>
                    <template #target>
                        <BButton
                            variant="outline-secondary"
                            @click="useCurrentFolder"
                        >
                            <span
                                class="d-inline-flex align-items-center gap-1"
                            >
                                <PhosphorIcon name="map-pin" />
                            </span>
                        </BButton>
                    </template>
                    {{ t('groups.treeSelect.useCurrentFolder') }}
                </BTooltip>
            </BCol>
        </BRow>

        <!-- Slug path preview (shown when a parent is selected) -->
        <BFormText v-if="ancestorChain.length > 0" class="mt-1 font-monospace">
            {{ slugPathPreview }}
        </BFormText>
    </div>
</template>
