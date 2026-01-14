<template>
    <component :is="errorViewer" :header="error.title" class="mb-3">
        <p>
            Error in element <code>{{ error.path }}</code
            >:
        </p>
        <p>{{ error.message }}</p>
        <hr />
        <pre>{{ JSON.stringify(error.originalError, null, 2) }}</pre>
    </component>
</template>
<script setup lang="ts">
import { getComponent } from '@/stores/formStructure';
import type { ValidationError } from '@educorvi/vue-json-form-schemas';

defineProps<{
    error: ValidationError<unknown>;
}>();

const errorViewer = getComponent('ErrorViewer');
</script>
