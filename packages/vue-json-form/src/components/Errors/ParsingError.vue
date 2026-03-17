<template>
    <component :is="errorViewer" :header="error.name" class="mb-3">
        <p>{{ error.message }}</p>
    </component>
</template>
<script setup lang="ts">
import { getStores } from '@/computedProperties/json.ts';

defineProps<{
    error: Error;
}>();

const errorViewer = getStores().formStructureStore.getComponent('ErrorViewer');
</script>
