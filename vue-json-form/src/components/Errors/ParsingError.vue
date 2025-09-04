<template>
    <component :is="errorViewer" :header="error.name" class="mb-3">
        <p>{{ error.message }}</p>
    </component>
</template>
<script setup lang="ts">
import { getComponent } from '@/stores/formStructure';

defineProps<{
    error: Error;
}>();

const errorViewer = getComponent('ErrorViewer');
</script>
