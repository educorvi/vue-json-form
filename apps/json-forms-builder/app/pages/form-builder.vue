<script setup lang="ts">
import FormBuilderApp from '@educorvi/vue-form-builder/src/App.vue';
import 'bootstrap/dist/css/bootstrap.min.css';

definePageMeta({ middleware: ['authenticated'], layout: false });
</script>

<template>
    <ClientOnly>
        <FormBuilderApp />
        <template #fallback>
            <div
                class="flex items-center justify-center h-screen text-surface-400 gap-3"
            >
                <i class="pi pi-spin pi-spinner text-2xl" />
                <span>Loading…</span>
            </div>
        </template>
    </ClientOnly>
</template>
