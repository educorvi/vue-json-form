<script setup lang="ts">
import { inject } from 'vue';
import { IMPORT_STATE_KEY } from './useImportState';
import ImportFileDropZone from './ImportFileDropZone.vue';

const { jsonFile, uiFile, jsonFileError, uiFileError } =
    inject(IMPORT_STATE_KEY)!;
</script>

<template>
    <div class="row g-4">
        <div class="col-6">
            <ImportFileDropZone
                v-model:file="jsonFile"
                label="JSON Schema file"
                input-id="import-json-file"
                :error="jsonFileError"
                @update:error="jsonFileError = $event"
            />
        </div>
        <div class="col-6">
            <ImportFileDropZone
                v-model:file="uiFile"
                label="UI Schema file"
                input-id="import-ui-file"
                :error="uiFileError"
                @update:error="uiFileError = $event"
            />
        </div>
    </div>
</template>
