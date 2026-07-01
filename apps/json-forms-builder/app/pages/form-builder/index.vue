<script setup lang="ts">
import FormBuilderApp from '@educorvi/vue-json-form-builder/src/App.vue';

definePageMeta({ middleware: ['authenticated'], layout: 'base-layout' });
</script>

<template>
    <ClientOnly>
        <div class="h-100 overflow-hidden">
            <FormBuilderApp />
        </div>
        <template #fallback>
            <div
                class="d-flex align-items-center justify-content-center gap-3 text-secondary"
                style="height: 24rem"
            >
                <BSpinner />
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
