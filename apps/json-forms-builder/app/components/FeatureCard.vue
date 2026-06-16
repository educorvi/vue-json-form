<script setup lang="ts">
defineProps<{
    icon: string;
    title: string;
    description: string;
}>();
</script>

<template>
    <Card class="shadow-1">
        <template #header>
            <div class="flex items-center justify-center pt-5 pb-2">
                <span
                    class="inline-flex items-center justify-center w-14 h-14 rounded-full surface-ground"
                >
                    <i :class="[icon, 'text-primary text-2xl']" />
                </span>
            </div>
        </template>
        <template #title>{{ title }}</template>
        <template #content>
            <p class="text-color-secondary line-height-3 m-0">
                {{ description }}
            </p>
        </template>
    </Card>
</template>
