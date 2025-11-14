<script setup lang="ts">
import type { Layout } from '@educorvi/vue-json-form-schemas';

const props = defineProps<{ page: Layout; pageName?: string }>();
</script>

<template>
    <div>
        <h2>{{ pageName }}</h2>
    </div>
</template>

<style scoped></style>
