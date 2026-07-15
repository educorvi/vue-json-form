<script setup lang="ts">
import { computed, provide, watch } from 'vue';
import { BModal, BTabs, BTab, BAlert, BButton } from 'bootstrap-vue-next';
import {
    PhPencil,
    PhUpload,
    PhWarning,
    PhCheck,
    PhX,
} from '@phosphor-icons/vue';
import { useToast } from 'bootstrap-vue-next';
import { useFormStore } from '@/stores/formStore';
import { useImportState, IMPORT_STATE_KEY } from './import/useImportState';
import ImportPasteTab from './import/ImportPasteTab.vue';
import ImportUploadTab from './import/ImportUploadTab.vue';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{ 'update:visible': [value: boolean] }>();

const store = useFormStore();
const { show: showToast } = useToast();

const visible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v),
});

const state = useImportState({
    loadSchemas: (json, ui) => store.loadSchemas(json, ui),
    onSuccess: () => {
        visible.value = false;
        showToast?.({
            props: {
                title: 'Imported',
                body: 'Schemas loaded successfully',
                variant: 'success',
                pos: 'top-end',
                interval: 3000,
            },
        });
    },
    onError: (message) => {
        showToast?.({
            props: {
                title: 'Import failed',
                body: message,
                variant: 'danger',
                pos: 'top-end',
                interval: 5000,
            },
        });
    },
});

const { activeTab, canImport, importing, doImport, reset } = state;

provide(IMPORT_STATE_KEY, state);

watch(visible, (v) => {
    if (!v) reset();
});

async function handleImport() {
    await doImport();
}
</script>

<template>
    <BModal
        v-model="visible"
        title="Import Schemas"
        size="lg"
        :hide-footer="true"
        @hide="reset"
    >
        <BAlert variant="warning" :model-value="true" class="mb-3">
            <PhWarning :size="16" weight="bold" class="me-1" />
            <span class="fw-medium"
                >Importing will replace your current form.</span
            >
            All existing fields and settings will be overwritten.
        </BAlert>

        <BTabs :index="activeTab" @update:index="activeTab = $event">
            <BTab title="Paste JSON">
                <template #title>
                    <PhPencil :size="14" weight="bold" class="me-1" />
                    Paste JSON
                </template>
                <div class="pt-3"><ImportPasteTab /></div>
            </BTab>
            <BTab title="Upload Files">
                <template #title>
                    <PhUpload :size="14" weight="bold" class="me-1" />
                    Upload Files
                </template>
                <div class="pt-3"><ImportUploadTab /></div>
            </BTab>
        </BTabs>

        <template #footer>
            <BButton variant="outline-secondary" @click="visible = false">
                <PhX :size="14" weight="bold" class="me-1" />Cancel
            </BButton>
            <BButton
                variant="primary"
                :disabled="!canImport"
                :class="{ 'btn-loading': importing }"
                @click="handleImport"
            >
                <template v-if="importing">
                    <span
                        class="spinner-border spinner-border-sm me-1"
                        role="status"
                    />
                    Importing...
                </template>
                <template v-else>
                    <PhCheck :size="14" weight="bold" class="me-1" />Import
                </template>
            </BButton>
        </template>
    </BModal>
</template>
