<script setup lang="ts">
defineProps<{
    icon: string;
    text: string | number;
    title: string; // Tooltip text and aria-label for accessibility.
}>();
</script>

<template>
    <span
        class="d-inline-flex align-items-center gap-1"
        v-b-tooltip="title"
        :aria-label="title"
    >
        <PhosphorIcon :name="icon" :size="14" aria-hidden="true" />
        {{ text }}
    </span>
</template>
