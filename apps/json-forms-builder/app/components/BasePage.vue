<script setup lang="ts">
defineProps<{
    title: string;
    description?: string;
}>();
</script>

<template>
    <div class="py-4 px-4">
        <div class="mb-4">
            <h1 class="h3 fw-bold">{{ title }}</h1>
            <p v-if="description" class="text-secondary">
                {{ description }}
            </p>
        </div>
        <slot />
    </div>
</template>
