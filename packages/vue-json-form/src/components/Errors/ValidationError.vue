<template>
    <component :is="errorViewer" :header="error.title" class="mb-3">
        <p>
            Error in element <code>{{ error.path }}</code
            >:
        </p>
        <p>{{ error.message }}</p>
        <hr />
        <pre>{{ JSON.stringify(error.internalError, null, 2) }}</pre>
    </component>
</template>
<script setup lang="ts">
import type { ValidationError } from '@educorvi/vue-json-form-schemas';
import { getStores } from '@/computedProperties/json.ts';

defineProps<{
    error: ValidationError<unknown>;
}>();

const errorViewer = getStores().formStructureStore.getComponent('ErrorViewer');
</script>
