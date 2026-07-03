<script setup lang="ts">
defineProps<{
    name: string;
    email: string;
}>();

function initials(name: string): string {
    return name
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');
}
</script>

<template>
    <div class="d-flex align-items-center gap-3">
        <span
            class="d-inline-flex align-items-center justify-content-center rounded-circle fw-semibold small flex-shrink-0 text-primary-emphasis"
            style="
                width: 40px;
                height: 40px;
                background-color: var(--bs-primary-bg-subtle);
            "
        >
            {{ initials(name) }}
        </span>
        <div class="d-flex flex-column">
            <span class="fw-medium">{{ name }}</span>
            <span class="small text-secondary">{{ email }}</span>
        </div>
    </div>
</template>
