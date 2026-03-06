<script setup lang="ts">
import type {
    ConfirmationModalEmits,
    ConfirmationModalProps,
    ConfirmationModalSlots,
} from '@/renderings/PropsAndEmitsForRenderings.ts';

const props = defineProps<ConfirmationModalProps>();
const emit = defineEmits<ConfirmationModalEmits>();
const slots = defineSlots<ConfirmationModalSlots>();

const show = () => {
    console.log(slots.default({})[0]?.children);
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
