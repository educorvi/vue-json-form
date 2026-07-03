<script setup lang="ts">
import { computed, provide, watch } from 'vue';
import { BModal, BTabs, BTab, BAlert } from 'bootstrap-vue-next';
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
        ok-title="Import"
        cancel-title="Cancel"
        :ok-disabled="!canImport"
        @ok.prevent="handleImport"
        @hide="reset"
    >
        <BAlert variant="warning" :model-value="true" class="mb-3">
            <span class="fw-medium">Importing will replace your current form.</span>
            All existing fields and settings will be overwritten.
        </BAlert>

        <BTabs :model-value="String(activeTab)" @update:model-value="activeTab = Number($event)">
            <BTab title="Paste JSON">
                <div class="pt-3"><ImportPasteTab /></div>
            </BTab>
            <BTab title="Upload Files">
                <div class="pt-3"><ImportUploadTab /></div>
            </BTab>
        </BTabs>
    </BModal>
</template>
