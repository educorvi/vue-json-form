<script setup lang="ts">
const props = defineProps<{
    label: string;
    labelFor: string;
}>();
</script>

<template>
    <label :for="labelFor">{{ label }}</label>
    <slot />
</template>

<style scoped></style>
