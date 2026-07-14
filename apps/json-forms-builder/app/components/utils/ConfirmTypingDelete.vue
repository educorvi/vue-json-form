<!--
    ConfirmTypingDelete – Delete confirmation modal that requires the user
    to type the item's name before the delete button becomes active.

    Events:
      update:modelValue — emitted when modal is hidden (close / cancel)
      confirm           — emitted when the user clicks the confirm button
                          (only when typed text === itemName && !pending)
-->
<script setup lang="ts">
const props = defineProps<{
    modelValue: boolean;
    title: string;
    warning: string;
    itemName: string;
    confirmLabel: string;
    cancelLabel: string;
    pending?: boolean;
    error?: string | null;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
    confirm: [];
}>();

const typedName = ref('');

const canConfirm = computed(() => typedName.value === props.itemName);

function onHide() {
    typedName.value = '';
    emit('update:modelValue', false);
}

function onConfirm() {
    if (!canConfirm.value || props.pending) return;
    emit('confirm');
}
</script>

<template>
    <BModal
        :model-value="modelValue"
        :title="title"
        ok-variant="danger"
        :ok-title="confirmLabel"
        :cancel-title="cancelLabel"
        :ok-disabled="!canConfirm || pending"
        :no-close-on-backdrop="pending"
        :no-close-on-esc="pending"
        @ok="onConfirm"
        @hide="onHide"
    >
        <p>{{ warning }}</p>

        <BFormGroup :label="itemName" label-class="fw-medium">
            <BFormInput
                v-model="typedName"
                :placeholder="itemName"
                :disabled="pending"
                autocomplete="off"
            />
        </BFormGroup>

        <BAlert
            v-if="error"
            variant="danger"
            :dismissible="false"
            class="mb-0 mt-2"
        >
            {{ error }}
        </BAlert>
    </BModal>
</template>
