<script setup lang="ts">
import type {
    ConfirmationModalEmits,
    ConfirmationModalProps,
    ConfirmationModalSlots,
} from '@/renderings/PropsAndEmitsForRenderings.ts';

defineProps<ConfirmationModalProps>();
const emit = defineEmits<ConfirmationModalEmits>();
const slots = defineSlots<ConfirmationModalSlots>();

const show = () => {
    const result = confirm(slots.default({})[0]?.children);
    if (result) {
        emit('confirm');
    } else {
        emit('cancel');
    }
};

defineExpose({ show });
</script>

<template></template>

<style scoped></style>
