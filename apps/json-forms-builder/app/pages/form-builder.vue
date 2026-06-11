<script setup lang="ts">
import FormBuilderApp from '@educorvi/vue-form-builder/src/App.vue';

definePageMeta({ middleware: ['authenticated'] });
</script>

<template>
    <ClientOnly>
        <div class="form-builder-root h-full">
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
/* Override the full-viewport height of the form-builder's root div so it
   fills the remaining space below the layout's menubar instead of the
   entire viewport (which would cause overflow). */
.form-builder-root :deep(.relative.flex.h-screen) {
    height: 100%;
}
</style>
