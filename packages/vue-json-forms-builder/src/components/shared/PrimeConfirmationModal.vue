<script setup lang="ts">
import { ref } from 'vue';
import { BModal, type ButtonVariant } from 'bootstrap-vue-next';

const props = defineProps<{
    title: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    hideCancelButton?: boolean;
    confirmButtonVariant?: ButtonVariant;
    cancelButtonVariant?: ButtonVariant;
}>();

const emit = defineEmits<{
    confirm: [];
    cancel: [];
}>();

defineSlots<{ default: (props: {}) => any }>();

const visible = ref(false);

function show() {
    visible.value = true;
}

defineExpose({ show });
</script>

<template>
    <BModal
        v-model="visible"
        :title="title"
        :ok-title="confirmButtonText ?? 'Confirm'"
        :cancel-title="cancelButtonText ?? 'Cancel'"
        :hide-footer="hideCancelButton"
        :ok-variant="confirmButtonVariant ?? 'primary'"
        @ok="emit('confirm')"
        @cancel="emit('cancel')"
    >
        <slot />
    </BModal>
</template>
