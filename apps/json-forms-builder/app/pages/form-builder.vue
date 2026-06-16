<script setup lang="ts">
import FormBuilderApp from '@educorvi/vue-form-builder/src/App.vue';

definePageMeta({ middleware: ['authenticated'], layout: 'fullscreen' });
</script>

<template>
    <ClientOnly>
        <!-- h-full fills the layout's <main class="flex-1 min-h-0 overflow-hidden"> -->
        <div class="h-full overflow-hidden">
            <FormBuilderApp />
        </div>
        <template #fallback>
            <div
                class="flex items-center justify-center h-96 text-surface-400 gap-3"
            >
                <i class="pi pi-spin pi-spinner text-2xl" />
                <span>Loading…</span>
            </div>
        </template>
    </ClientOnly>
</template>

<style scoped>
:deep(.relative.flex.h-screen) {
    height: 100%;
}
</style>
