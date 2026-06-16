<script setup lang="ts">
import { ref } from 'vue';
import { BModal } from 'bootstrap-vue-next';
import { useFormStore } from '@/stores/formStore';
import ExportDialog from './ExportDialog.vue';
import ImportDialog from './ImportDialog.vue';

const store = useFormStore();
const showResetModal = ref(false);

function toggleTheme() {
    store.setThemeMode(store.themeMode === 'light' ? 'dark' : 'light');
}

function doReset() {
    store.clearForm();
}
</script>

<template>
    <div
        class="d-flex align-items-center gap-2 px-3 py-2 bg-body border-bottom flex-shrink-0 flex-wrap"
    >
        <!-- Left side: form title -->
        <div class="d-flex align-items-center gap-2 me-auto">
            <i class="bi bi-pencil-square text-primary" />
            <input
                type="text"
                class="form-control form-control-sm form-control-transparent"
                :value="store.jsonSchema.title"
                placeholder="Form Title"
                @input="
                    store.jsonSchema.title = ($event.target as HTMLInputElement).value
                "
            />
        </div>

        <!-- Theme toggle -->
        <button
            class="btn btn-sm btn-outline-secondary"
            :title="
                store.themeMode === 'light'
                    ? 'Switch to dark mode'
                    : 'Switch to light mode'
            "
            @click="toggleTheme"
        >
            <i
                :class="
                    store.themeMode === 'light' ? 'bi bi-moon' : 'bi bi-sun'
                "
            />
        </button>

        <div class="vr" />

        <!-- Preview toggle -->
        <button
            class="btn btn-sm"
            :class="
                store.isPreviewInline
                    ? 'btn-secondary'
                    : 'btn-outline-secondary'
            "
            @click="store.togglePreviewInline()"
        >
            <i
                :class="
                    store.isPreviewInline ? 'bi bi-pencil' : 'bi bi-eye'
                "
                class="me-1"
            />{{ store.isPreviewInline ? 'Edit' : 'Preview' }}
        </button>

        <!-- Export -->
        <button
            class="btn btn-sm btn-primary"
            title="Export JSON &amp; UI Schema"
            @click="store.openExport()"
        >
            <i class="bi bi-download me-1" />Export
        </button>

        <!-- Import -->
        <button
            class="btn btn-sm btn-outline-primary"
            title="Import JSON &amp; UI Schema"
            @click="store.openImport()"
        >
            <i class="bi bi-upload me-1" />Import
        </button>

        <!-- Reset -->
        <button
            class="btn btn-sm btn-outline-danger"
            title="Reset form to empty state"
            @click="showResetModal = true"
        >
            <i class="bi bi-arrow-clockwise me-1" />Reset
        </button>

        <!-- Export dialog -->
        <ExportDialog v-model:visible="store.isExportOpen" />

        <!-- Import dialog -->
        <ImportDialog v-model:visible="store.isImportOpen" />
    </div>

    <!-- Reset confirm modal -->
    <BModal
        v-model="showResetModal"
        title="Reset Form"
        ok-variant="danger"
        ok-title="Reset"
        cancel-title="Cancel"
        @ok="doReset"
    >
        This will clear all fields and settings. Are you sure you want to reset
        the form?
    </BModal>
</template>
