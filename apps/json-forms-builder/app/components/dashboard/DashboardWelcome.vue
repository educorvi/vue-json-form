<script setup lang="ts">
defineProps<{
    userName: string;
}>();
</script>

<template>
    <div class="d-flex align-items-center gap-4 mb-5 mt-2">
        <div
            class="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10"
            style="width: 64px; height: 64px; flex-shrink: 0"
        >
            <PhosphorIcon name="user-circle" :size="36" class="text-primary" />
        </div>
        <div>
            <h1 class="h2 fw-bold mb-1">
                {{ $t('dashboard.welcomeTitle', { name: userName }) }}
            </h1>
            <p class="text-secondary mb-0">
                {{ $t('dashboard.welcomeDescription') }}
            </p>
        </div>
    </div>
</template>
