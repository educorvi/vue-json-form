<script setup lang="ts">
import { computed } from 'vue';
import { useFormStore } from '@/stores/formStore';
import BootstrapTree from '@/components/shared/BootstrapTree.vue';
import type { BootstrapTreeItem } from '@/components/shared/BootstrapTreeNode.vue';
import type { FormElement, WizardElement } from '@/types/formTypes';
import { wrapElement } from '@/types/elements';

const store = useFormStore();

function buildTreeItems(elements: FormElement[]): BootstrapTreeItem[] {
    return elements.map((el) => {
        const node$ = wrapElement(el);
        const item: BootstrapTreeItem = {
            id: el._id,
            label: node$.getLabel(store.jsonSchema as any),
            icon: node$.icon,
            type: el.type,
        };
        if (node$.isContainer && node$.children) {
            item.children = buildTreeItems(node$.children);
        }
        return item;
    });
}

const treeData = computed((): BootstrapTreeItem[] => {
    const root = store.rootLayout;
    if (root.type === 'Wizard') {
        const wizard$ = wrapElement(root);
        return [
            {
                id: root._id,
                label: wizard$.getLabel(store.jsonSchema as any),
                icon: wizard$.icon,
                type: root.type,
                children: root.pages.map((page, i) => ({
                    id: page._id,
                    label: (page.options as any)?.label ?? `Page ${i + 1}`,
                    icon: 'bi bi-file-earmark',
                    type: 'WizardPage',
                    children: buildTreeItems(page.elements),
                })),
            },
        ];
    }
    return buildTreeItems(root.elements);
});

const selectedId = computed(() => store.selectedElementId);

/** Find which wizard page index contains the element (or its parent recursively). */
function findWizardPageIndex(elementId: string): number | null {
    const root = store.rootLayout;
    if (root.type !== 'Wizard') return null;
    const wiz = root as unknown as WizardElement;
    for (let i = 0; i < wiz.pages.length; i++) {
        const page = wiz.pages[i];
        // Check if this page ID matches
        if (page._id === elementId) return i;
        // Check if element is directly in this page's elements
        if (page.elements.some((el) => el._id === elementId)) return i;
        // Recursively check nested elements
        if (findInElements(page.elements, elementId)) return i;
    }
    return null;
}

/** Recursively search for an element id in a tree of FormElements. */
function findInElements(elements: FormElement[], id: string): boolean {
    for (const el of elements) {
        if (el._id === id) return true;
        const node$ = wrapElement(el);
        if (node$.isContainer && node$.children) {
            if (findInElements(node$.children, id)) return true;
        }
    }
    return false;
}

function onSelect(id: string) {
    // Switch to the correct wizard page if needed
    const pageIdx = findWizardPageIndex(id);
    if (pageIdx !== null && store.rootLayout.type === 'Wizard') {
        store.activeWizardPageIndex = pageIdx;
    }

    // Select the element
    store.selectElement(id);

    // Scroll to the element in the canvas
    setTimeout(() => {
        const el = document.querySelector(
            `[data-element-id="${id}"]`
        ) as HTMLElement | null;
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);
}
</script>

<template>
    <div class="d-flex flex-column h-100 overflow-hidden">
        <div
            class="px-3 py-2 text-xs text-body-secondary fw-semibold flex-shrink-0 border-bottom"
        >
            Form Structure Tree
        </div>
        <div class="flex-grow-1 overflow-y-auto p-2">
            <BootstrapTree
                :nodes="treeData"
                :selected-id="selectedId"
                empty-text="No elements yet"
                empty-icon="ph ph-archive"
                @select="onSelect"
            />
        </div>
    </div>
</template>
