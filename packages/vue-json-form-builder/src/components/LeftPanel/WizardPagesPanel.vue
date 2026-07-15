<script setup lang="ts">
import { ref, computed } from 'vue';
import { BButton } from 'bootstrap-vue-next';
import {
    PhPlus,
    PhBook,
    PhList,
    PhFile,
    PhPencil,
    PhTrash,
    PhInfo,
} from '@phosphor-icons/vue';
import { VueDraggable } from 'vue-draggable-plus';
import { useFormStore } from '@/stores/formStore';
import type { WizardElement, WizardPage } from '@/types/formTypes';

const store = useFormStore();

const wizard = computed(() =>
    store.rootLayout.type === 'Wizard'
        ? (store.rootLayout as unknown as WizardElement)
        : null
);

const localPages = computed({
    get: () => (wizard.value?.pages ?? []) as WizardPage[],
    set: () => {},
});

const editingIndex = ref<number | null>(null);
const editingLabel = ref('');

function startEdit(index: number) {
    const page = wizard.value?.pages[index];
    if (!page) return;
    editingIndex.value = index;
    editingLabel.value = (page.options as any)?.label ?? `Page ${index + 1}`;
}

function commitEdit() {
    if (editingIndex.value === null) return;
    store.renameWizardPage(editingIndex.value, editingLabel.value);
    editingIndex.value = null;
}

function cancelEdit() {
    editingIndex.value = null;
}

function onDragEnd(event: { oldIndex?: number; newIndex?: number }) {
    const from = event.oldIndex;
    const to = event.newIndex;
    if (from !== undefined && to !== undefined && from !== to) {
        store.reorderWizardPage(from, to);
    }
}

function activatePage(index: number) {
    store.activeWizardPageIndex = index;
}

function removePage(index: number) {
    const page = wizard.value?.pages[index];
    const hasContent = (page?.elements.length ?? 0) > 0;
    if (hasContent) {
        if (
            window.confirm(
                'This page has elements that will be deleted. Remove anyway?'
            )
        ) {
            store.removeWizardPage(index);
        }
    } else {
        store.removeWizardPage(index);
    }
}

function pageLabel(page: WizardPage, index: number): string {
    return (page.options as any)?.label ?? `Page ${index + 1}`;
}
</script>

<template>
    <div class="d-flex flex-column h-100 overflow-hidden">
        <!-- Header -->
        <div
            class="d-flex align-items-center justify-content-between px-3 py-2 border-bottom flex-shrink-0"
        >
            <span class="text-xs text-body">Wizard Pages</span>
            <BButton
                variant="primary"
                size="sm"
                class="py-0 text-xs"
                title="Add page"
                @click="store.addWizardPage()"
            >
                <PhPlus :size="12" weight="bold" class="me-1" /> Add Page
            </BButton>
        </div>

        <!-- No wizard fallback -->
        <div
            v-if="!wizard"
            class="flex-grow-1 d-flex align-items-center justify-content-center text-body small p-3 text-center"
        >
            <div>
                <PhBook :size="24" weight="bold" class="d-block mb-2 mx-auto" />
                Switch the root layout to Wizard to manage pages here.
            </div>
        </div>

        <!-- Page list -->
        <div v-else class="flex-grow-1 overflow-y-auto p-2">
            <VueDraggable
                v-model="wizard.pages as any"
                handle=".page-drag-handle"
                ghost-class="opacity-50"
                :animation="150"
                @end="onDragEnd"
            >
                <div
                    v-for="(page, i) in wizard.pages"
                    :key="page._id"
                    class="d-flex align-items-center gap-1 px-2 py-1 rounded mb-1 border small"
                    :class="
                        store.activeWizardPageIndex === i
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-secondary-subtle bg-body-secondary'
                    "
                    style="cursor: pointer"
                    @click="activatePage(i)"
                    @dblclick="startEdit(i)"
                >
                    <PhList
                        class="page-drag-handle flex-shrink-0 text-body"
                        :size="12"
                        style="cursor: grab"
                    />
                    <PhFile
                        :size="12"
                        class="flex-shrink-0"
                        :class="
                            store.activeWizardPageIndex === i
                                ? 'text-primary'
                                : 'text-body'
                        "
                    />

                    <input
                        v-if="editingIndex === i"
                        v-model="editingLabel"
                        class="form-control form-control-sm flex-grow-1 py-0"
                        style="min-width: 0"
                        autofocus
                        @blur="commitEdit"
                        @keydown.enter.prevent="commitEdit"
                        @keydown.escape.prevent="cancelEdit"
                        @click.stop
                    />

                    <span
                        v-else
                        class="flex-grow-1 text-truncate text-xs"
                        :class="
                            store.activeWizardPageIndex === i
                                ? 'text-primary fw-medium'
                                : 'text-body'
                        "
                        >{{ pageLabel(page, i) }}</span
                    >

                    <div
                        class="d-flex align-items-center gap-1 flex-shrink-0"
                        @click.stop
                    >
                        <BButton
                            variant="link"
                            size="sm"
                            class="p-0 border-0 text-body text-decoration-none"
                            style="
                                width: 1.2rem;
                                height: 1.2rem;
                                line-height: 1;
                            "
                            title="Rename page"
                            @click.stop="startEdit(i)"
                        >
                            <PhPencil :size="10" weight="bold" />
                        </BButton>
                        <BButton
                            v-if="wizard.pages.length > 1"
                            variant="link"
                            size="sm"
                            class="p-0 border-0 text-danger text-decoration-none"
                            style="
                                width: 1.2rem;
                                height: 1.2rem;
                                line-height: 1;
                            "
                            title="Remove page"
                            @click.stop="removePage(i)"
                        >
                            <PhTrash :size="10" weight="bold" />
                        </BButton>
                    </div>
                </div>
            </VueDraggable>

            <p
                v-if="wizard.pages.length === 0"
                class="text-center text-body text-xs py-3"
            >
                No pages yet — click "Add Page" above.
            </p>
        </div>

        <!-- Footer hint -->
        <div
            v-if="wizard"
            class="px-3 py-2 text-xs text-body border-top flex-shrink-0"
        >
            <PhInfo :size="12" weight="bold" class="me-1" />
            Drag <PhList :size="12" weight="bold" class="mx-1" /> to reorder ·
            Double-click to rename
        </div>
    </div>
</template>
