<script setup lang="ts">
import { inject } from 'vue';
import { IMPORT_STATE_KEY } from './useImportState';
import ImportSchemaTextarea from './ImportSchemaTextarea.vue';

const { jsonText, uiText } = inject(IMPORT_STATE_KEY)!;
</script>

<template>
    <div class="row g-3">
        <div class="col-6">
            <ImportSchemaTextarea
                v-model="jsonText"
                label="JSON Schema"
                placeholder='{ "$schema": "...", "type": "object", ... }'
            />
        </div>
        <div class="col-6">
            <ImportSchemaTextarea
                v-model="uiText"
                label="UI Schema"
                placeholder='{ "version": "2.1", "layout": { "type": "VerticalLayout", ... } }'
            />
        </div>
    </div>
</template>
