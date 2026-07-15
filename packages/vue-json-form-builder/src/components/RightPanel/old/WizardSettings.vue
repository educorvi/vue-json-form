<script setup lang="ts">
import { ref } from 'vue';
import { BButton, BModal } from 'bootstrap-vue-next';
import {
    PhBook,
    PhPencil,
    PhCaretUp,
    PhCaretDown,
    PhTrash,
    PhPlus,
    PhLayout,
    PhList,
    PhTable,
    PhFolder,
    PhWarning,
} from '@phosphor-icons/vue';
import { useFormStore } from '@/stores/formStore';
import SettingsSection from '@/components/shared/SettingsSection.vue';
import type { WizardElement, WizardPage } from '@/types/formTypes';

const props = defineProps<{
    element: WizardElement;
}>();

const store = useFormStore();

const editingIndex = ref<number | null>(null);
const editingLabel = ref('');

const confirmDeleteIndex = ref<number | null>(null);
const showDeleteConfirm = ref(false);

function pageLabel(page: WizardPage, index: number): string {
    return (page.options as any)?.label ?? `Page ${index + 1}`;
}

function startEdit(index: number) {
    editingIndex.value = index;
    editingLabel.value = pageLabel(props.element.pages[index], index);
}

function commitEdit() {
    if (editingIndex.value === null) return;
    store.renameWizardPage(editingIndex.value, editingLabel.value);
    editingIndex.value = null;
}

function cancelEdit() {
    editingIndex.value = null;
}

function confirmRemovePage(index: number) {
    const page = props.element.pages[index];
    if ((page?.elements.length ?? 0) > 0) {
        confirmDeleteIndex.value = index;
        showDeleteConfirm.value = true;
    } else {
        store.removeWizardPage(index);
    }
}

function doRemovePage() {
    if (confirmDeleteIndex.value !== null) {
        store.removeWizardPage(confirmDeleteIndex.value);
        confirmDeleteIndex.value = null;
    }
    showDeleteConfirm.value = false;
}

const layoutTypeOpts = [
    { label: 'Vertical', value: 'VerticalLayout', icon: PhList },
    { label: 'Horizontal', value: 'HorizontalLayout', icon: PhTable },
    { label: 'Group', value: 'Group', icon: PhFolder },
];
</script>

<template>
    <div class="vstack gap-1">
        <!-- Pages list -->
        <SettingsSection title="Pages" :icon="PhBook">
            <div class="vstack gap-1">
                <div
                    v-for="(page, i) in element.pages"
                    :key="page._id"
                    class="d-flex align-items-center gap-1 rounded px-1 py-1"
                    :class="
                        store.activeWizardPageIndex === i
                            ? 'bg-primary-subtle'
                            : ''
                    "
                >
                    <!-- Page number badge -->
                    <BButton
                        :variant="
                            store.activeWizardPageIndex === i
                                ? 'primary'
                                : 'outline-secondary'
                        "
                        size="sm"
                        class="rounded-circle p-0 d-flex align-items-center justify-content-center flex-shrink-0 fw-semibold"
                        :class="
                            store.activeWizardPageIndex === i
                                ? 'text-white'
                                : 'text-body'
                        "
                        style="
                            width: 1.25rem;
                            height: 1.25rem;
                            font-size: 0.65rem;
                        "
                        :title="`Switch to page ${i + 1}`"
                        @click="store.activeWizardPageIndex = i"
                        >{{ i + 1 }}</BButton
                    >

                    <!-- Inline rename input -->
                    <input
                        v-if="editingIndex === i"
                        v-model="editingLabel"
                        class="form-control form-control-sm flex-grow-1 py-0"
                        style="min-width: 0; height: 1.5rem"
                        autofocus
                        @blur="commitEdit"
                        @keydown.enter.prevent="commitEdit"
                        @keydown.escape.prevent="cancelEdit"
                    />

                    <!-- Label display -->
                    <span
                        v-else
                        class="flex-grow-1 text-truncate text-xs"
                        :class="
                            store.activeWizardPageIndex === i
                                ? 'fw-medium text-primary'
                                : 'text-body'
                        "
                        style="cursor: pointer"
                        :title="'Double-click to rename'"
                        @dblclick="startEdit(i)"
                        @click="store.activeWizardPageIndex = i"
                        >{{ pageLabel(page, i) }}</span
                    >

                    <!-- Actions -->
                    <div class="d-flex align-items-center gap-1 flex-shrink-0">
                        <BButton
                            v-if="editingIndex !== i"
                            variant="link"
                            size="sm"
                            class="p-0 border-0 text-body text-decoration-none"
                            style="
                                width: 1.2rem;
                                height: 1.2rem;
                                line-height: 1;
                            "
                            title="Rename"
                            @click="startEdit(i)"
                        >
                            <PhPencil :size="10" weight="bold" />
                        </BButton>
                        <BButton
                            :disabled="i === 0"
                            variant="link"
                            size="sm"
                            class="p-0 border-0 text-decoration-none"
                            :class="i > 0 ? 'text-body' : 'text-muted'"
                            style="
                                width: 1.2rem;
                                height: 1.2rem;
                                line-height: 1;
                            "
                            title="Move up"
                            @click="store.reorderWizardPage(i, i - 1)"
                        >
                            <PhCaretUp :size="10" weight="bold" />
                        </BButton>
                        <BButton
                            :disabled="i === element.pages.length - 1"
                            variant="link"
                            size="sm"
                            class="p-0 border-0 text-decoration-none"
                            :class="
                                i < element.pages.length - 1
                                    ? 'text-body'
                                    : 'text-muted'
                            "
                            style="
                                width: 1.2rem;
                                height: 1.2rem;
                                line-height: 1;
                            "
                            title="Move down"
                            @click="store.reorderWizardPage(i, i + 1)"
                        >
                            <PhCaretDown :size="10" weight="bold" />
                        </BButton>
                        <BButton
                            :disabled="element.pages.length <= 1"
                            variant="link"
                            size="sm"
                            class="p-0 border-0 text-decoration-none"
                            :class="
                                element.pages.length > 1
                                    ? 'text-danger'
                                    : 'text-muted'
                            "
                            style="
                                width: 1.2rem;
                                height: 1.2rem;
                                line-height: 1;
                            "
                            title="Remove page"
                            @click="confirmRemovePage(i)"
                        >
                            <PhTrash :size="10" weight="bold" />
                        </BButton>
                    </div>
                </div>

                <!-- Add page button -->
                <BButton
                    variant="outline-secondary"
                    size="sm"
                    class="w-100 mt-1 text-xs border-dashed"
                    style="border-style: dashed !important"
                    @click="store.addWizardPage()"
                >
                    <PhPlus :size="12" weight="bold" class="me-1" />Add Page
                </BButton>
            </div>
        </SettingsSection>

        <!-- Active page layout type -->
        <SettingsSection title="Active Page Layout" :icon="PhLayout">
            <div class="btn-group btn-group-sm w-100" role="group">
                <BButton
                    v-for="opt in layoutTypeOpts"
                    :key="opt.value"
                    size="sm"
                    :variant="
                        element.pages[store.activeWizardPageIndex]?.type ===
                        opt.value
                            ? 'primary'
                            : 'outline-secondary'
                    "
                    @click="
                        element.pages[store.activeWizardPageIndex] &&
                        (element.pages[store.activeWizardPageIndex].type =
                            opt.value as any)
                    "
                >
                    <component
                        :is="opt.icon"
                        :size="12"
                        weight="bold"
                        class="me-1"
                    />{{ opt.label }}
                </BButton>
            </div>
        </SettingsSection>
    </div>

    <!-- Delete confirmation modal -->
    <BModal
        v-model="showDeleteConfirm"
        title="Remove Page"
        ok-variant="danger"
        ok-title="Remove"
        cancel-title="Cancel"
        @ok="doRemovePage"
    >
        <PhWarning
            :size="20"
            weight="bold"
            class="text-warning me-2 float-start"
        />
        <span class="fw-medium"
            >This page has elements that will be deleted.</span
        >
        <p class="mb-0 mt-1">Remove anyway?</p>
    </BModal>
</template>
