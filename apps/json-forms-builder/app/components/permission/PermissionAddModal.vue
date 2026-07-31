<!--
    PermissionAddModal – Modal for adding a new permission to a group or form.

    Features:
    - User search with autocomplete (fetches from users API sorted by last_activity)
    - Role selection with inherited role awareness
    - Optional expiration date
-->
<script setup lang="ts">
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';
import type { PermissionEntry, ElementRole } from '@/composables/usePermission';
import {
    isRoleAssignable,
    getHighestInheritedRole,
} from '@/composables/usePermission';
import BootstrapSelect from '~/components/custom/BootstrapSelect.vue';

const props = defineProps<{
    modelValue: boolean;
    /** The inherited/existing permissions – used to suggest minimum role */
    existingPermissions: PermissionEntry[];
}>();

const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
    add: [data: { role: ElementRole; user_id: string; expire: string | null }];
}>();

const { t } = useI18n();

// ── User search (async via BootstrapSelect filter) ────────────────────────

const userOptions = ref<Array<{ id: string; name: string; email: string }>>([]);
const searching = ref(false);
const selectedUser = ref<string | null>(null);
const userFilterText = ref('');
/** Cached info of the selected user — survives search filtering */
const selectedUserInfo = ref<{ name: string; email: string } | null>(null);

let userSearchTimer: ReturnType<typeof setTimeout> | null = null;

async function loadUsers(searchTerm?: string) {
    searching.value = true;
    try {
        const result = await orpc.users.list({
            query: {
                page: 1,
                page_size: 20,
                search: searchTerm || undefined,
                sort_order: 'desc',
                order_by: 'last_activity',
            },
        });
        userOptions.value = (result?.data ?? []).map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
        }));
    } catch {
        userOptions.value = [];
    } finally {
        searching.value = false;
    }
}

watch(userFilterText, (val) => {
    if (userSearchTimer) clearTimeout(userSearchTimer);
    if (!val || val.length < 2) {
        // Show all users when filter is empty/short
        loadUsers();
        return;
    }
    userSearchTimer = setTimeout(() => {
        loadUsers(val);
    }, 300);
});

// Overwrite the selectedUserInfo when user picks someone
watch(selectedUser, (userId) => {
    if (!userId) {
        selectedUserInfo.value = null;
        suggestedMinRole.value = null;
        return;
    }
    const user = userOptions.value.find((u) => u.id === userId);
    if (user) {
        selectedUserInfo.value = { name: user.name, email: user.email };
    }
    const inheritedRole = getHighestInheritedRole(
        props.existingPermissions,
        userId
    );
    suggestedMinRole.value = inheritedRole;
});

// ── Role selection ────────────────────────────────────────────────────────

const ROLES = ['owner', 'editor', 'guest'] as const;
const selectedRole = ref<ElementRole>('editor');
const suggestedMinRole = ref<string | null>(null);

const roleOptions = computed(() => {
    return ROLES.map((role) => {
        const assignable = isRoleAssignable(role, suggestedMinRole.value);
        return {
            value: role,
            label: t(`permissions.roles.${role}`),
            disabled: !assignable,
        };
    });
});

// ── Expiration date ───────────────────────────────────────────────────────

const expireDate = ref('');

// ── Validation ────────────────────────────────────────────────────────────

const canSubmit = computed(
    () => selectedUser.value !== null && !!selectedRole.value
);

function handleSubmit() {
    if (!canSubmit.value || !selectedUser.value) return;
    emit('add', {
        role: selectedRole.value,
        user_id: selectedUser.value,
        expire: expireDate.value || null,
    });
}

// ── Reset on open ─────────────────────────────────────────────────────────

watch(
    () => props.modelValue,
    (open) => {
        if (open) {
            selectedUser.value = null;
            selectedUserInfo.value = null;
            userFilterText.value = '';
            selectedRole.value = 'editor';
            expireDate.value = '';
            suggestedMinRole.value = null;
            // Load the first page of users so the dropdown has content
            loadUsers();
        }
    }
);
</script>

<template>
    <BModal
        :model-value="modelValue"
        :title="t('permissions.addTitle')"
        @update:model-value="emit('update:modelValue', $event)"
        @ok="handleSubmit"
        :ok-disabled="!canSubmit || searching"
        :ok-title="t('permissions.addButton')"
        :cancel-title="t('common.cancel')"
    >
        <!-- User search (async with BootstrapSelect) -->
        <BFormGroup
            :label="t('permissions.form.user')"
            label-class="fw-medium"
            class="mb-3"
        >
            <BootstrapSelect
                v-model="selectedUser"
                :options="userOptions"
                option-label="name"
                option-value="id"
                :placeholder="t('permissions.form.userPlaceholder')"
                :empty-text="t('permissions.form.userNotFound')"
                filter
                filter-placeholder="Search users..."
                v-model:filter-text="userFilterText"
                :loading="searching"
                show-clear
                class="w-100"
            >
                <template #value="{ value }">
                    <div
                        v-if="value && selectedUserInfo"
                        class="d-flex align-items-center gap-2 w-100"
                    >
                        <UserPreviewCell
                            :name="selectedUserInfo.name"
                            :email="selectedUserInfo.email"
                        />
                    </div>
                    <span v-else class="text-body-tertiary">{{
                        t('permissions.form.userPlaceholder')
                    }}</span>
                </template>
                <template #option="{ option }">
                    <UserPreviewCell
                        :name="option.name"
                        :email="option.email"
                    />
                </template>
            </BootstrapSelect>

            <BFormText v-if="suggestedMinRole" class="text-warning">
                <PhosphorIcon name="info" :size="14" class="me-1" />
                {{
                    t('permissions.form.inheritHint', {
                        role: t(`permissions.roles.${suggestedMinRole}`),
                    })
                }}
            </BFormText>
        </BFormGroup>

        <!-- Role selection (BootstrapSelect) -->
        <BFormGroup
            :label="t('permissions.form.role')"
            label-class="fw-medium"
            class="mb-3"
        >
            <BootstrapSelect
                v-model="selectedRole"
                :options="roleOptions"
                option-label="label"
                option-value="value"
                :placeholder="t('permissions.form.rolePlaceholder')"
                class="w-100"
            />
            <BFormText
                v-if="suggestedMinRole"
                class="text-warning d-flex align-items-center gap-1"
            >
                <PhosphorIcon name="info" :size="14" />
                {{
                    t('permissions.form.inheritHint', {
                        role: t(`permissions.roles.${suggestedMinRole}`),
                    })
                }}
            </BFormText>
        </BFormGroup>

        <!-- Expiration date -->
        <BFormGroup
            :label="t('permissions.form.expire')"
            label-class="fw-medium"
        >
            <BFormInput v-model="expireDate" type="date" />
            <BFormText>
                {{ t('permissions.form.expireHint') }}
            </BFormText>
        </BFormGroup>
    </BModal>
</template>
