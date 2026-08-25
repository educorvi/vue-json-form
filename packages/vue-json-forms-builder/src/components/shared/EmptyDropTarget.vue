<script setup lang="ts">
/**
 * EmptyDropTarget.vue
 *
 * Reusable empty-state placeholder shown inside drop zones when
 * there are no children yet. Displays a large arrow icon and
 * instructional text in muted grey tones.
 */
import { PhArrowLeft } from '@phosphor-icons/vue';

defineProps<{
    /** Primary text, e.g. "Drag fields here to build your form" */
    message?: string;
    /** Secondary text, e.g. "Or click a field in the left panel" */
    submessage?: string;
}>();
</script>

<template>
    <div
        class="d-flex flex-column align-items-center justify-content-center py-5 text-body-tertiary canvas-preview w-100"
    >
        <PhArrowLeft :size="24" weight="bold" class="d-block mb-2 opacity-50" />
        <p class="small fw-medium mb-0 text-body-secondary">
            {{ message ?? 'Drag fields here to build your form' }}
        </p>
        <p class="text-xs mt-1 mb-0 text-body-tertiary">
            {{ submessage ?? 'Or click a field in the left panel' }}
        </p>
    </div>
</template>
