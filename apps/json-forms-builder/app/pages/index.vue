<script setup lang="ts">
const { data } = await useFetch('/api/status');
</script>

<template>
    <pre>{{ data }}</pre>
</template>
