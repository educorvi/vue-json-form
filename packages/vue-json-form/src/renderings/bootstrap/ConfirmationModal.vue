<script setup lang="ts">
import type {
    ConfirmationModalEmits,
    ConfirmationModalProps,
    ConfirmationModalSlots,
} from '@/renderings/PropsAndEmitsForRenderings.ts';
import { BModal } from 'bootstrap-vue-next';
import { computed, useTemplateRef } from 'vue';

const props = defineProps<ConfirmationModalProps>();
const emit = defineEmits<ConfirmationModalEmits>();
defineSlots<ConfirmationModalSlots>();

const modal = useTemplateRef<InstanceType<typeof BModal>>('modal');

const show = () => {
    modal.value?.show();
};

defineExpose({ show });
</script>

<template>
    <BModal
        ref="modal"
        centered
        :title="props.title"
        :ok-title="props.confirmButtonText"
        :ok-variant="props.confirmButtonVariant"
        :cancel-title="props.cancelButtonText"
        :cancel-variant="props.cancelButtonVariant"
        :ok-only="props.hideCancelButton"
        @ok="emit('confirm')"
        @cancel="emit('cancel')"
    >
        <slot />
    </BModal>
</template>
