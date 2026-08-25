<script setup lang="ts">
defineProps<{
    label: string;
    htmlFor?: string;
    required?: boolean;
    hint?: string;
}>();
</script>

<template>
    <div class="mb-2">
        <label
            v-if="label"
            :for="htmlFor"
            class="form-label text-xs fw-medium text-body mb-1"
        >
            {{ label }}
            <span v-if="required" class="text-danger ms-1">*</span>
        </label>
        <slot />
        <div v-if="hint" class="form-text text-xs mt-1">{{ hint }}</div>
    </div>
</template>
