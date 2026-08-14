<script setup lang="ts">
import { computed, ref } from 'vue';
import { BButton, BFormInput, BModal } from 'bootstrap-vue-next';
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
import { Form, FormDefinition } from '@educorvi/vue-json-form-builder-schemas';
import { useFormBuilder } from '../../useFormBuilder';
import {
    useUiState,
    setThemeMode,
    togglePreviewInline,
} from '../../useUiState';
import OnlineState from './OnlineState.vue';
import ExportDialog from './ExportDialog.vue';
import ImportDialog from './ImportDialog.vue';

const builder = useFormBuilder();
const { themeMode, isPreviewInline } = useUiState();

const isExportOpen = ref(false);
const isImportOpen = ref(false);
const showResetModal = ref(false);

const title = computed<string>({
    get: () => builder.formDefinition.value?.root.title ?? '',
    set: (v: string) => {
        const fd = builder.formDefinition.value;
        if (!fd) return;
        builder.updateElementField(fd.root.uid, 'title', v);
    },
});

function toggleTheme() {
    setThemeMode(themeMode.value === 'light' ? 'dark' : 'light');
}

function doReset() {
    // Local mode only: reset to a fresh empty form
    builder.loadDefinition(
        new FormDefinition(new Form({ id: 'form', title: 'My Form' }))
    );
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
                v-model="title"
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
                themeMode === 'light'
                    ? 'Switch to dark mode'
                    : 'Switch to light mode'
            "
            @click="toggleTheme"
        >
            <PhMoon v-if="themeMode === 'light'" :size="14" weight="bold" />
            <PhSun v-else :size="14" weight="bold" />
        </b-button>

        <div class="vr" />

        <!-- Preview toggle -->
        <b-button
            size="sm"
            :variant="isPreviewInline ? 'secondary' : 'outline-secondary'"
            @click="togglePreviewInline()"
        >
            <PhPencil
                v-if="isPreviewInline"
                :size="14"
                weight="bold"
                class="me-1"
            />
            <PhEye v-else :size="14" weight="bold" class="me-1" />
            {{ isPreviewInline ? 'Edit' : 'Preview' }}
        </b-button>

        <!-- Realtime status -->
        <OnlineState />

        <div class="vr" />

        <!-- Export -->
        <b-button
            size="sm"
            variant="primary"
            title="Export JSON &amp; UI Schema"
            @click="isExportOpen = true"
        >
            <PhDownload :size="14" weight="bold" class="me-1" />Export
        </b-button>

        <!-- Import -->
        <b-button
            size="sm"
            variant="outline-primary"
            title="Import JSON &amp; UI Schema"
            @click="isImportOpen = true"
        >
            <PhUpload :size="14" weight="bold" class="me-1" />Import
        </b-button>

        <!-- Reset (local mode only) -->
        <b-button
            v-if="!builder.isCollab"
            size="sm"
            variant="outline-danger"
            title="Reset form to empty state"
            @click="showResetModal = true"
        >
            <PhArrowsClockwise :size="14" weight="bold" class="me-1" />Reset
        </b-button>

        <!-- Export dialog -->
        <ExportDialog v-model:visible="isExportOpen" />

        <!-- Import dialog -->
        <ImportDialog v-model:visible="isImportOpen" />
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
