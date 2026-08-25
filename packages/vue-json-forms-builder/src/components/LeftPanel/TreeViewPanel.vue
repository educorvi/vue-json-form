<script setup lang="ts">
import { computed } from 'vue';
import { useFormBuilder } from '../../useFormBuilder';
import BootstrapTree from '@/components/shared/BootstrapTree.vue';
import type { BootstrapTreeItem } from '@/components/shared/BootstrapTreeNode.vue';
import type { CollabUser } from '@educorvi/vue-json-forms-builder-schemas/collab';
import {
    ContainerElement,
    type Form,
    type FormDefinition,
    type FormElement,
} from '@educorvi/vue-json-forms-builder-schemas';
import { uiFor } from '@/elements';

const builder = useFormBuilder();

/** Users that currently have the given element selected. */
function selectorsFor(uid: string): CollabUser[] {
    return builder.remotePresences.value
        .filter((p) => p.selection.elementId === uid)
        .map((p) => p.user);
}

/** The schema `type` literal of the element — part of the data, not UI metadata. */
function elementType(el: FormElement | Form): string {
    return (el.data as { type?: string }).type ?? 'unknown';
}

function buildTreeItems(
    childUids: string[],
    fd: FormDefinition
): BootstrapTreeItem[] {
    return childUids.map((uid) => {
        const el = fd.getElementById(uid);
        if (!el)
            return {
                id: uid,
                label: uid,
                icon: 'bi bi-question-circle',
                type: 'unknown',
            };
        const item: BootstrapTreeItem = {
            id: el.uid,
            // presentation (icon, label) comes from the element's ElementUi
            label: uiFor(el).label(el),
            icon: uiFor(el).icon(el),
            type: elementType(el),
            // remote users that have this element selected (tree/canvas)
            presence: selectorsFor(el.uid),
        };
        if (el instanceof ContainerElement && el.children.length > 0) {
            item.children = buildTreeItems(el.children, fd);
        }
        return item;
    });
}

const treeData = computed((): BootstrapTreeItem[] => {
    const fd = builder.formDefinition.value;
    if (!fd) return [];
    const root = fd.root;
    return [
        {
            id: root.uid,
            label: uiFor(root).label(root),
            icon: uiFor(root).icon(root),
            type: elementType(root),
            presence: selectorsFor(root.uid),
            children: buildTreeItems(root.children, fd),
        },
    ];
});

const selectedId = computed(() => builder.selectedElementId.value);

function onSelect(id: string) {
    builder.selectElement(id);

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
