<script setup lang="ts">
import { computed } from 'vue';
import { useFormStore } from '@/stores/formStore';
import TreeViewNode from './TreeViewNode.vue';
import type { FormElement } from '@/types/formTypes';
import { wrapElement } from '@/types/elements';

const store = useFormStore();

export interface TreeNode {
    id: string;
    label: string;
    icon: string;
    type: string;
    children?: TreeNode[];
    depth: number;
}

function buildTree(elements: FormElement[], depth = 0): TreeNode[] {
    return elements.map((el) => {
        const node$ = wrapElement(el);
        const node: TreeNode = {
            id: el._id,
            label: node$.getLabel(store.jsonSchema as any),
            icon: node$.icon,
            type: el.type,
            depth,
        };
        if (node$.isContainer && node$.children) {
            node.children = buildTree(node$.children, depth + 1);
        }
        return node;
    });
}

const tree = computed(() => {
    const root = store.rootLayout;
    if (root.type === 'Wizard') {
        const wizardNode: TreeNode = {
            id: root._id,
            label: 'Wizard',
            icon: 'bi bi-book',
            type: 'Wizard',
            depth: 0,
            children: root.pages.map((page, i) => ({
                id: page._id,
                label: (page.options as any)?.label ?? `Page ${i + 1}`,
                icon: 'bi bi-file-earmark',
                type: 'WizardPage',
                children: buildTree(page.elements, 2),
                depth: 1,
            })),
        };
        return [wizardNode];
    }
    return buildTree(root.elements);
});
</script>

<template>
    <div class="d-flex flex-column h-100 overflow-hidden">
        <div class="px-3 py-2 text-xs text-body flex-shrink-0 border-bottom">
            Form Structure Tree
        </div>
        <div class="flex-grow-1 overflow-y-auto p-2">
            <div
                v-if="tree.length === 0"
                class="text-center text-body small py-4"
            >
                <i class="bi bi-inbox d-block mb-2" style="font-size: 1.5rem" />
                No elements yet
            </div>
            <TreeViewNode v-for="node in tree" :key="node.id" :node="node" />
        </div>
    </div>
</template>
