<!--
    PermissionEditModal – Modal for editing an existing permission (role, expiration).

    Changes are patched instantly on submit.
-->
<script setup lang="ts">
import type { PermissionEntry } from '@/composables/usePermission';
import type { ElementRole } from '@/utils/api-types';
import { isRoleAssignable } from '@/composables/usePermission';
import BootstrapSelect from '~/components/custom/BootstrapSelect.vue';

const props = defineProps<{
    modelValue: boolean;
    permission: PermissionEntry | null;
    /** The inherited role for this user (if any) – used to restrict role downgrades */
    inheritedRole: string | null;
    /**
     * True when this is the user's OWN owner permission and they are the
     * only owner of the resource — the role may not be lowered at all.
     */
    lockOwnerRole?: boolean;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
    save: [
        permissionId: number,
        data: { role?: ElementRole; expire?: string | null },
    ];
}>();

const { t } = useI18n();

const ROLES = ['owner', 'editor', 'guest'] as const;
const editRole = ref<ElementRole>('editor');
const editExpire = ref('');

const roleOptions = computed(() => {
    return ROLES.map((role) => {
        const lockedByOnlyOwner =
            props.lockOwnerRole && role !== 'owner';
        const assignable = lockedByOnlyOwner
            ? false
            : isRoleAssignable(role, props.inheritedRole);
        return {
            value: role,
            label: t(`permissions.roles.${role}`),
            disabled: !assignable,
        };
    });
});

const canSubmit = computed(() => !!editRole.value);

function handleSave() {
    if (!props.permission) return;
    const data: { role?: ElementRole; expire?: string | null } = {};
    if (editRole.value !== props.permission.role) {
        data.role = editRole.value;
    }
    const newExpire = editExpire.value || null;
    if (newExpire !== props.permission.expire) {
        data.expire = newExpire;
    }
    emit('save', props.permission.id, data);
}

// Reset form when modal opens
watch(
    () => props.modelValue,
    (open) => {
        if (open && props.permission) {
            editRole.value = (props.permission.role as ElementRole) ?? 'editor';
            editExpire.value = props.permission.expire
                ? props.permission.expire.slice(0, 10)
                : '';
        }
    }
);
</script>

<template>
    <BModal
        :model-value="modelValue"
        :title="t('permissions.editTitle')"
        @update:model-value="emit('update:modelValue', $event)"
        @ok="handleSave"
        :ok-disabled="!canSubmit"
        :ok-title="t('settings.save')"
        :cancel-title="t('common.cancel')"
    >
        <div v-if="permission" class="mb-3">
            <UserPreviewCell
                :name="permission.user?.name ?? ''"
                :email="permission.user?.email ?? ''"
            />
        </div>

        <BFormGroup
            :label="t('permissions.form.role')"
            label-class="fw-medium"
            class="mb-3"
        >
            <BootstrapSelect
                v-model="editRole"
                :options="roleOptions"
                option-label="label"
                option-value="value"
                :placeholder="t('permissions.form.rolePlaceholder')"
                class="w-100"
            />
            <BFormText
                v-if="lockOwnerRole"
                class="text-danger d-flex align-items-center gap-1"
            >
                <Icon name="ph:warning" :size="14" />
                {{ t('permissions.onlyOwner.roleLockedHint') }}
            </BFormText>
            <BFormText
                v-else-if="inheritedRole"
                class="text-warning d-flex align-items-center gap-1"
            >
                <Icon name="ph:info" :size="14" />
                {{
                    t('permissions.form.inheritHint', {
                        role: t(`permissions.roles.${inheritedRole}`),
                    })
                }}
            </BFormText>
        </BFormGroup>

        <BFormGroup
            :label="t('permissions.form.expire')"
            label-class="fw-medium"
        >
            <BFormInput v-model="editExpire" type="date" />
            <BFormText>
                {{ t('permissions.form.expireHint') }}
            </BFormText>
        </BFormGroup>
    </BModal>
</template>
