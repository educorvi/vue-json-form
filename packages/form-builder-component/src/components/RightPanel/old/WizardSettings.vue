<script setup lang="ts">
import { ref } from 'vue';
import { useFormStore } from '@/stores/formStore';
import SettingsSection from '@/components/shared/SettingsSection.vue';
import type { WizardElement, WizardPage } from '@/types/formTypes';

const props = defineProps<{
    element: WizardElement;
}>();

const store = useFormStore();

const editingIndex = ref<number | null>(null);
const editingLabel = ref('');

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

function removePage(index: number) {
    const page = props.element.pages[index];
    const hasContent = (page?.elements.length ?? 0) > 0;
    if (hasContent) {
        if (window.confirm('This page has elements that will be deleted. Remove anyway?')) {
            store.removeWizardPage(index);
        }
    } else {
        store.removeWizardPage(index);
    }
}

const layoutTypeOpts = [
    { label: 'Vertical', value: 'VerticalLayout', icon: 'bi bi-list' },
    { label: 'Horizontal', value: 'HorizontalLayout', icon: 'bi bi-table' },
    { label: 'Group', value: 'Group', icon: 'bi bi-folder' },
];
</script>

<template>
    <div class="vstack gap-1">
        <!-- Pages list -->
        <SettingsSection title="Pages" icon="bi bi-book">
            <div class="vstack gap-1">
                <div
                    v-for="(page, i) in element.pages"
                    :key="page._id"
                    class="d-flex align-items-center gap-1 rounded px-1 py-1"
                    :class="store.activeWizardPageIndex === i ? 'bg-primary bg-opacity-10' : ''"
                >
                    <!-- Page number badge -->
                    <button
                        class="btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center flex-shrink-0 fw-semibold"
                        style="width: 1.25rem; height: 1.25rem; font-size: 0.65rem"
                        :class="store.activeWizardPageIndex === i ? 'btn-primary' : 'btn-outline-secondary'"
                        :title="`Switch to page ${i + 1}`"
                        @click="store.activeWizardPageIndex = i"
                    >{{ i + 1 }}</button>

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
                        :class="store.activeWizardPageIndex === i ? 'fw-medium text-primary' : 'text-body'"
                        style="cursor: text"
                        :title="'Double-click to rename'"
                        @dblclick="startEdit(i)"
                        @click="store.activeWizardPageIndex = i"
                    >{{ pageLabel(page, i) }}</span>

                    <!-- Actions -->
                    <div class="d-flex align-items-center gap-1 flex-shrink-0">
                        <button
                            v-if="editingIndex !== i"
                            class="btn btn-sm p-0 border-0 text-body"
                            style="width: 1.2rem; height: 1.2rem; line-height: 1"
                            title="Rename"
                            @click="startEdit(i)"
                        ><i class="bi bi-pencil text-xs" /></button>
                        <button
                            :disabled="i === 0"
                            class="btn btn-sm p-0 border-0"
                            :class="i > 0 ? 'text-body' : 'text-muted'"
                            style="width: 1.2rem; height: 1.2rem; line-height: 1"
                            title="Move up"
                            @click="store.reorderWizardPage(i, i - 1)"
                        ><i class="bi bi-chevron-up text-xs" /></button>
                        <button
                            :disabled="i === element.pages.length - 1"
                            class="btn btn-sm p-0 border-0"
                            :class="i < element.pages.length - 1 ? 'text-body' : 'text-muted'"
                            style="width: 1.2rem; height: 1.2rem; line-height: 1"
                            title="Move down"
                            @click="store.reorderWizardPage(i, i + 1)"
                        ><i class="bi bi-chevron-down text-xs" /></button>
                        <button
                            :disabled="element.pages.length <= 1"
                            class="btn btn-sm p-0 border-0"
                            :class="element.pages.length > 1 ? 'text-danger' : 'text-muted'"
                            style="width: 1.2rem; height: 1.2rem; line-height: 1"
                            title="Remove page"
                            @click="removePage(i)"
                        ><i class="bi bi-trash text-xs" /></button>
                    </div>
                </div>

                <!-- Add page button -->
                <button
                    class="btn btn-sm btn-outline-secondary border-dashed w-100 mt-1 text-xs"
                    style="border-style: dashed !important"
                    @click="store.addWizardPage()"
                >
                    <i class="bi bi-plus me-1" />Add Page
                </button>
            </div>
        </SettingsSection>

        <!-- Active page layout type -->
        <SettingsSection title="Active Page Layout" icon="bi bi-layout-split">
            <div class="d-flex gap-1">
                <button
                    v-for="opt in layoutTypeOpts"
                    :key="opt.value"
                    class="btn btn-sm flex-grow-1 py-0 text-xs"
                    :class="element.pages[store.activeWizardPageIndex]?.type === opt.value ? 'btn-primary' : 'btn-outline-secondary'"
                    style="font-size: 0.7rem"
                    @click="element.pages[store.activeWizardPageIndex] && (element.pages[store.activeWizardPageIndex].type = opt.value as any)"
                >
                    <i :class="opt.icon" class="me-1" />{{ opt.label }}
                </button>
            </div>
        </SettingsSection>
    </div>
</template>
