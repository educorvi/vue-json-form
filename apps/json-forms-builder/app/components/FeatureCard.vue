<script setup lang="ts">
// import type { Component } from 'vue';

defineProps<{
    // icon: Component;
    title: string;
    description: string;
}>();
</script>

<template>
    <BCard class="h-100 text-center">
        <BCardBody class="align-items-center">
            <div
                class="d-inline-flex align-items-center justify-content-center bg-light mb-3"
                style="width: 56px; height: 56px"
            >
                <!-- <component :is="icon" :size="28" class="text-primary" /> -->
            </div>
            <BCardTitle class="h5 mb-2">{{ title }}</BCardTitle>
            <p class="card-text text-secondary mb-0">
                {{ description }}
            </p>
        </BCardBody>
    </BCard>
</template>
