<template>
    <component :is="errorViewer" :header="error.keyword" class="mb-3">
        <p>
            Error in element <code>{{ error.instancePath }}</code
            >:
        </p>
        <p>{{ error.message }}</p>
    </component>
</template>
<script setup lang="ts">
import type { ErrorObject } from 'ajv';
import { getComponent } from '@/stores/formStructure';

defineProps<{
    error: ErrorObject;
}>();

const errorViewer = getComponent('ErrorViewer');
</script>
