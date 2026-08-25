<script setup lang="ts">
const { toasts, dismiss } = useNotify();
</script>

<template>
    <div
        aria-live="polite"
        aria-atomic="true"
        class="toast-container position-fixed top-0 end-0 p-3"
        style="max-width: 420px"
    >
        <BToast
            v-for="t in toasts"
            :key="t.id"
            :model-value="5000"
            :variant="t.variant"
            :title="t.title"
            solid
            class="mb-2"
            @close="dismiss(t.id)"
        >
            {{ t.text }}
        </BToast>
    </div>
</template>
