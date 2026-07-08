<script setup lang="ts">
import { VueJsonFormBuilder } from '@educorvi/vue-json-form-builder';

defineProps<{
    jsonSchema?: string;
    uiSchema?: string;
}>();
</script>

<template>
    <VueJsonFormBuilder
        :json-schema="jsonSchema"
        :ui-schema="uiSchema"
    ></VueJsonFormBuilder>
</template>

<style scoped></style>
