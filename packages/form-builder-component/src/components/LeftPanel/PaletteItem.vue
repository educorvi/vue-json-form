<script setup lang="ts">
import type { PaletteField } from '@/types/formTypes';
import { BCard } from 'bootstrap-vue-next';

defineProps<{ field: PaletteField }>();
const emit = defineEmits<{ click: [id: string] }>();
</script>

<template>
    <div
        class="palette-item d-flex flex-column align-items-center gap-1 p-2 rounded border border-dark-subtle text-center"
        :title="field.description"
        @click="emit('click', field.id)"
    >
        <i :class="field.icon" class="text-primary" style="font-size: 0.9rem" />
        <span class="text-xs text-body lh-sm">{{ field.label }}</span>
    </div>
</template>
