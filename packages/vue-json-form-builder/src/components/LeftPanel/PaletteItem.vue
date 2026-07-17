<script setup lang="ts">
import type { PaletteField } from '@/types/formTypes';

defineProps<{ field: PaletteField; compact?: boolean }>();
const emit = defineEmits<{ click: [id: string] }>();
</script>

<template>
    <div
        class="palette-item d-flex flex-column align-items-center justify-content-center gap-1 p-2 rounded border border-dark-subtle text-center h-100"
        :class="compact ? 'py-1 px-1' : ''"
        :title="field.description"
        @click="emit('click', field.id)"
    >
        <i
            :class="field.icon"
            class="text-primary"
            :style="compact ? 'font-size: 0.75rem' : 'font-size: 0.9rem'"
        />
        <span
            class="lh-sm"
            :class="
                compact
                    ? 'text-2xs text-body-secondary'
                    : 'text-xs text-body-secondary'
            "
            >{{ field.label }}</span
        >
    </div>
</template>
