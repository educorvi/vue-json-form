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
        @click="emit('click')"
        :disabled="props.disabled"
        :aria-label="props.ariaLabel"
    >
        <slot />
    </b-button>
</template>

<style scoped></style>
