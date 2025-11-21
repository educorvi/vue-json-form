<script setup lang="ts">
import type {
    ArrayButtonEmits,
    ArrayButtonProps,
} from '@/renderings/PropsAndEmitsForRenderings.ts';
import { BButton } from 'bootstrap-vue-next';

const props = defineProps<ArrayButtonProps>();
const emit = defineEmits<ArrayButtonEmits>();
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
