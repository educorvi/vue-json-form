<script setup lang="ts">
import { ref } from 'vue';
import { BModal, BButton, BFormInput } from 'bootstrap-vue-next';
import {
    PhPencilSimple,
    PhMoon,
    PhSun,
    PhEye,
    PhPencil,
    PhDownload,
    PhUpload,
    PhArrowsClockwise,
} from '@phosphor-icons/vue';
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
            <PhPencilSimple :size="16" class="text-primary" weight="bold" />
            <b-form-input
                v-model="store.jsonSchema.title"
                size="sm"
                class="form-control-transparent"
                placeholder="Form Title"
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
            <PhMoon
                v-if="store.themeMode === 'light'"
                :size="14"
                weight="bold"
            />
            <PhSun v-else :size="14" weight="bold" />
        </b-button>

        <div class="vr" />

        <!-- Preview toggle -->
        <b-button
            size="sm"
            :variant="store.isPreviewInline ? 'secondary' : 'outline-secondary'"
            @click="store.togglePreviewInline()"
        >
            <PhPencil
                v-if="store.isPreviewInline"
                :size="14"
                weight="bold"
                class="me-1"
            />
            <PhEye v-else :size="14" weight="bold" class="me-1" />
            {{ store.isPreviewInline ? 'Edit' : 'Preview' }}
        </b-button>

        <!-- Export -->
        <b-button
            size="sm"
            variant="primary"
            title="Export JSON &amp; UI Schema"
            @click="store.openExport()"
        >
            <PhDownload :size="14" weight="bold" class="me-1" />Export
        </b-button>

        <!-- Import -->
        <b-button
            size="sm"
            variant="outline-primary"
            title="Import JSON &amp; UI Schema"
            @click="store.openImport()"
        >
            <PhUpload :size="14" weight="bold" class="me-1" />Import
        </b-button>

        <!-- Reset -->
        <b-button
            size="sm"
            variant="outline-danger"
            title="Reset form to empty state"
            @click="showResetModal = true"
        >
            <PhArrowsClockwise :size="14" weight="bold" class="me-1" />Reset
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
