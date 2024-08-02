<script setup lang="ts">
import ErrorViewer from '@/renderings/bootstrap/ErrorViewer.vue';
import { injectJsonData } from '@/computedProperties/json';
const { jsonElement } = injectJsonData();
</script>

<template>
    <error-viewer header="Unsupported">
        <p>This field type is not supported!</p>
        <p class="text-muted">{{ jsonElement }}</p>
    </error-viewer>
</template>

<style scoped></style>
