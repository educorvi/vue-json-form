<script setup lang="ts">
const props = defineProps<{ page: string }>();
</script>

<template>
    <div>
        <h2>{{ props.page }}</h2>
    </div>
</template>

<style scoped></style>
