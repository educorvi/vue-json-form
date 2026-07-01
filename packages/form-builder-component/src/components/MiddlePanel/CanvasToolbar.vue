<script setup lang="ts">
import { ref } from 'vue';
import { BModal, BButton, BFormInput } from 'bootstrap-vue-next';
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
            <b-form-input
                size="sm"
                class="form-control-transparent"
                :model-value="store.jsonSchema.title"
                placeholder="Form Title"
                @update:model-value="store.jsonSchema.title = $event"
            />
        </div>

        <!-- Theme toggle -->
        <b-button
            size="sm"
            variant="outline-secondary"
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
        </b-button>

        <div class="vr" />

        <!-- Preview toggle -->
        <b-button
            size="sm"
            :variant="
                store.isPreviewInline
                    ? 'secondary'
                    : 'outline-secondary'
            "
            @click="store.togglePreviewInline()"
        >
            <i
                :class="
                    store.isPreviewInline ? 'bi bi-pencil' : 'bi bi-eye'
                "
                class="me-1"
            />{{ store.isPreviewInline ? 'Edit' : 'Preview' }}
        </b-button>

        <!-- Export -->
        <b-button
            size="sm"
            variant="primary"
            title="Export JSON &amp; UI Schema"
            @click="store.openExport()"
        >
            <i class="bi bi-download me-1" />Export
        </b-button>

        <!-- Import -->
        <b-button
            size="sm"
            variant="outline-primary"
            title="Import JSON &amp; UI Schema"
            @click="store.openImport()"
        >
            <i class="bi bi-upload me-1" />Import
        </b-button>

        <!-- Reset -->
        <b-button
            size="sm"
            variant="outline-danger"
            title="Reset form to empty state"
            @click="showResetModal = true"
        >
            <i class="bi bi-arrow-clockwise me-1" />Reset
        </b-button>

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
