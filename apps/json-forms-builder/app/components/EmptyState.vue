<script setup lang="ts">
import type { Component } from 'vue';
import { PhTray } from '@phosphor-icons/vue';

withDefaults(
    defineProps<{
        icon?: Component;
        title: string;
        description?: string;
    }>(),
    {
        icon: () => PhTray,
    }
);
</script>

<template>
    <div
        class="d-flex flex-column align-items-center justify-content-center py-5 text-center"
    >
        <div
            class="d-flex align-items-center justify-content-center rounded-circle bg-light mb-3"
            style="width: 80px; height: 80px"
        >
            <component :is="icon" :size="40" class="text-secondary" />
        </div>
        <p class="fs-5 fw-semibold mb-1">{{ title }}</p>
        <p
            v-if="description"
            class="text-secondary small"
            style="max-width: 20rem"
        >
            {{ description }}
        </p>
        <slot />
    </div>
</template>
