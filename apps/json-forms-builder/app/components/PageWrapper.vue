<script setup lang="ts">
defineProps<{
    /** Tailwind max-width class, default is max-w-6xl */
    maxWidth?: string;
}>();
</script>

<template>
    <div class="p-6">
        <div :class="['mx-auto', $props.maxWidth ?? 'max-w-6xl']">
            <slot />
        </div>
    </div>
</template>
