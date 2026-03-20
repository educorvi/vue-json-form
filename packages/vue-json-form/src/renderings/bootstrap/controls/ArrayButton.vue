<script setup lang="ts">
import type {
    ArrayButtonEmits,
    ArrayButtonProps,
    ArrayButtonSlots,
} from '@/renderings/PropsAndEmitsForRenderings.ts';
import { BButton } from 'bootstrap-vue-next';

const props = defineProps<ArrayButtonProps>();
const emit = defineEmits<ArrayButtonEmits>();
defineSlots<ArrayButtonSlots>();
</script>

<template>
    <b-button
        :variant="props.variant"
        :disabled="props.disabled"
        :aria-label="props.ariaLabel"
        @click="emit('click')"
    >
        <slot />
    </b-button>
</template>

<style scoped></style>
