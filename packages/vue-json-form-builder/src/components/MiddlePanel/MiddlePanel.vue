<script setup lang="ts">
import { useFormStore } from '@/stores/formStore';
import CanvasToolbar from './CanvasToolbar.vue';
import FormCanvas from './FormCanvas.vue';
import PreviewPanel from './PreviewPanel.vue';

const store = useFormStore();

defineProps<{
    hideToolbar?: boolean;
}>();
</script>

<template>
    <div
        class="d-flex flex-column h-100 bg-body-secondary overflow-hidden text-body"
    >
        <CanvasToolbar v-if="!hideToolbar" />

        <div class="flex-grow-1 overflow-y-auto bg-body-tertiary">
            <div class="mx-auto py-4 px-3" style="max-width: 768px">
                <FormCanvas v-if="!store.isPreviewInline" />
                <PreviewPanel v-else />
            </div>
        </div>
    </div>
</template>
