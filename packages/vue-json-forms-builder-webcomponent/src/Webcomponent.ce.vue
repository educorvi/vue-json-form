<script setup lang="ts">
import { VueJsonFormBuilder } from '@educorvi/vue-json-form-builder';
import type { JSONSchema } from '@educorvi/vue-json-form-schemas';
import type { UISchema } from '@educorvi/vue-json-form';

defineProps<{
    jsonSchema?: string;
    uiSchema?: string;
}>();

const emit = defineEmits<{
    vjfbChange: [jsonSchema: JSONSchema, uiSchema: UISchema];
}>();

function handleVJFBChange(jsonSchema: JSONSchema, uiSchema: UISchema) {
    emit('vjfbChange', jsonSchema, uiSchema);
}
</script>

<template>
    <VueJsonFormBuilder
        :json-schema="jsonSchema"
        :ui-schema="uiSchema"
        @vjfb-change="handleVJFBChange"
    ></VueJsonFormBuilder>
</template>

<style scoped></style>
