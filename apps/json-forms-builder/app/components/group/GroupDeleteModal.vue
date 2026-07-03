<script setup lang="ts">
/**
 * GroupDeleteModal — Type-to-confirm deletion dialog.
 *
 * The user must type the exact group name to enable the delete button.
 * Shows a warning that all contained elements will be deleted.
 */
import type { z } from 'zod';
import type { zGroup } from '~~/server/orpc/generated/zod.gen';

type GroupRow = z.infer<typeof zGroup>;

const props = defineProps<{
    group: GroupRow;
    pending: boolean;
}>();

const emit = defineEmits<{
    confirm: [group: GroupRow];
    cancel: [];
}>();

const { t } = useI18n();

const confirmText = ref('');
const visible = defineModel<boolean>({ required: true });

const canConfirm = computed(
    () =>
        confirmText.value.trim() ===
        (props.group.title || props.group.name || '')
);

// Reset input when modal opens
watch(visible, (v) => {
    if (v) confirmText.value = '';
});
</script>

<template>
    <BModal
        v-model="visible"
        :title="t('groups.delete.title')"
        :ok-title="t('groups.delete.confirm')"
        :cancel-title="t('groups.delete.cancel')"
        ok-variant="danger"
        :ok-disabled="!canConfirm || pending"
        :busy="pending"
        @ok="emit('confirm', group)"
        @cancel="emit('cancel')"
    >
        <!-- Warning -->
        <BAlert variant="warning" :dismissible="false" class="mb-3">
            <div class="d-flex align-items-center gap-2">
                <PhosphorIcon name="warning" />
                <strong>{{ t('groups.delete.warning') }}</strong>
            </div>
        </BAlert>

        <!-- Group info -->
        <div class="mb-3">
            <p class="mb-1">
                <span class="fw-semibold">{{ group.title || group.name }}</span>
                <small class="text-secondary ms-2">
                    ({{ group.group_count }} {{ t('groups.subGroups') }},
                    {{ group.form_count }}
                    {{ t('groups.forms') }})
                </small>
            </p>
        </div>

        <!-- Type-to-confirm input -->
        <BFormGroup
            :label="
                t('groups.delete.confirmPrompt', {
                    name: group.title || group.name,
                })
            "
        >
            <BFormInput
                v-model="confirmText"
                :placeholder="group.title || group.name"
                autofocus
            />
        </BFormGroup>
    </BModal>
</template>
