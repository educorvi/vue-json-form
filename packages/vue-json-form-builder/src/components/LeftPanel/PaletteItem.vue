<script setup lang="ts">
import type { PaletteField } from '@/types/paletteFields';

defineProps<{ field: PaletteField; compact?: boolean }>();
const emit = defineEmits<{ click: [field: PaletteField] }>();
</script>

<template>
    <div
        class="palette-item d-flex flex-column align-items-center justify-content-center gap-1 p-2 rounded border border-dark-subtle text-center h-100"
        :class="compact ? 'py-1 px-1' : ''"
        :title="field.description"
        :data-palette-type="field.id"
        @click="emit('click', field)"
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
