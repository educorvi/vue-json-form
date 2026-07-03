<script setup lang="ts">
defineProps<{
    role: string;
}>();

function roleBadgeVariant(role: string): string {
    return role === 'admin' ? 'danger' : 'secondary';
}
</script>

<template>
    <span :class="'badge bg-' + roleBadgeVariant(role)" class="text-capitalize">
        {{ role }}
    </span>
</template>
