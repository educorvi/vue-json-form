<script setup lang="ts">
import { PhPencilSimple, PhArrowSquareOut } from '@phosphor-icons/vue';
import { supportedUiSchemaVersion, version } from '@educorvi/vue-json-form';

defineProps<{
    openInBuilder?: boolean;
    builderUrl?: string;
    documentName?: string;
}>();
</script>

<template>
    <div
        class="app-header d-flex align-items-center px-3 gap-2 bg-dark shadow-sm"
        data-bs-theme="dark"
    >
        <PhPencilSimple :size="16" class="text-primary" weight="bold" />
        <span class="text-white fw-semibold small">JSON Forms Generator</span>
        <a
            v-if="openInBuilder && builderUrl"
            :href="builderUrl"
            target="_blank"
            rel="noopener"
            class="btn btn-sm btn-outline-light d-inline-flex align-items-center gap-1 ms-2"
            :title="`Open in form builder (${documentName})`"
        >
            <PhArrowSquareOut :size="14" weight="bold" />
            <span class="small">Open in builder</span>
        </a>
        <span class="text-body ms-auto" style="font-size: 0.7rem"
            >VueJsonForm v{{ version }} · UI Schema v{{
                supportedUiSchemaVersion
            }}</span
        >
    </div>
</template>
