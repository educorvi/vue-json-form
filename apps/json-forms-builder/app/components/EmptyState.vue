<script setup lang="ts">
defineProps<{
    icon?: string;
    title: string;
    description?: string;
}>();
</script>

<template>
    <div class="flex flex-col items-center justify-center py-6 text-center">
        <div
            class="w-20 h-20 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-2"
        >
            <i :class="icon ?? 'pi pi-inbox'" style="font-size: 2.5rem" />
        </div>
        <p
            class="text-xl font-semibold text-surface-700 dark:text-surface-200 mb-1"
        >
            {{ title }}
        </p>
        <p v-if="description" class="text-sm text-surface-400 max-w-xs">
            {{ description }}
        </p>
        <slot />
    </div>
</template>
