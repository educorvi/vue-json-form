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
import type { PermissionEntry } from '@/composables/usePermission';
import {
    ROLE_HIERARCHY,
    isRoleAssignable,
    getHighestInheritedRole,
} from '@/composables/usePermission';

const props = defineProps<{
    modelValue: boolean;
    orpc: RouterClient<AppRouter>;
    /** The inherited/existing permissions – used to suggest minimum role */
    existingPermissions: PermissionEntry[];
}>();

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
    add: [data: { role: string; user_id: string; expire: string | null }];
}>();

const { t } = useI18n();

// ── User search ───────────────────────────────────────────────────────────

const searchFilterText = ref('');
const userOptions = ref<Array<{ id: string; name: string; email: string }>>([]);
const searching = ref(false);
const selectedUser = ref<string | null>(null);

let searchTimer: ReturnType<typeof setTimeout> | null = null;

const userDisplayCache = computed(() => {
    const u = selectedUser.value;
    if (!u) return null;
    return userOptions.value.find((o) => o.id === u) ?? null;
});

watch(searchFilterText, (val) => {
    if (searchTimer) clearTimeout(searchTimer);
    if (!val || val.length < 2) {
        userOptions.value = [];
        return;
    }
    searchTimer = setTimeout(async () => {
        searching.value = true;
        try {
            const result = (await (props.orpc.users as any).list({
                query: {
                    page: 1,
                    page_size: 20,
                    search: val,
                    sort_order: 'desc',
                    order_by: 'last_activity',
                },
            })) as {
                data: Array<{
                    id: string;
                    name: string;
                    email: string;
                }>;
            };
            userOptions.value = result?.data ?? [];
        } catch {
            userOptions.value = [];
        } finally {
            searching.value = false;
        }
    }, 300);
});

function selectUser(userId: string) {
    selectedUser.value = userId;
    const user = userOptions.value.find((u) => u.id === userId);
    if (user) {
        const inheritedRole = getHighestInheritedRole(
            props.existingPermissions,
            userId
        );
        suggestedMinRole.value = inheritedRole;
    }
}

function clearUserSelection() {
    selectedUser.value = null;
    searchFilterText.value = '';
    userOptions.value = [];
    suggestedMinRole.value = null;
}

// ── Role selection ────────────────────────────────────────────────────────

const ROLES = ['owner', 'editor', 'guest'] as const;
type Role = (typeof ROLES)[number];
const selectedRole = ref<Role>('editor');
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
            searchFilterText.value = '';
            userOptions.value = [];
            selectedUser.value = null;
            selectedRole.value = 'editor';
            expireDate.value = '';
            suggestedMinRole.value = null;
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
        <!-- User search -->
        <BFormGroup
            :label="t('permissions.form.user')"
            label-class="fw-medium"
            class="mb-3"
        >
            <BFormInput
                v-model="searchFilterText"
                :placeholder="t('permissions.form.userPlaceholder')"
                autocomplete="off"
                :state="selectedUser ? true : null"
            />

            <!-- Selected user display -->
            <div v-if="selectedUser && userDisplayCache" class="mt-2">
                <UserPreviewCell
                    :name="userDisplayCache.name"
                    :email="userDisplayCache.email"
                />
            </div>

            <!-- Search results -->
            <div
                v-if="searchFilterText.length >= 2 && !selectedUser && userOptions.length > 0"
                class="border rounded mt-1 overflow-auto"
                style="max-height: 200px"
            >
                <div
                    v-for="user in userOptions"
                    :key="user.id"
                    class="p-2 border-bottom"
                    style="cursor: pointer"
                    @click="selectUser(user.id)"
                >
                    <UserPreviewCell
                        :name="user.name"
                        :email="user.email"
                    />
                </div>
            </div>
            <div
                v-else-if="searchFilterText.length >= 2 && !selectedUser && searching"
                class="text-secondary small mt-1"
            >
                <BSpinner small /> {{ t('common.loading') }}
            </div>
            <div
                v-else-if="searchFilterText.length >= 2 && !selectedUser && !searching && userOptions.length === 0"
                class="text-secondary small mt-1"
            >
                {{ t('permissions.form.userNotFound') }}
            </div>

            <!-- Clear selection -->
            <BButton
                v-if="selectedUser"
                variant="link"
                size="sm"
                class="p-0 mt-1"
                @click="clearUserSelection"
            >
                {{ t('common.clear') }}
            </BButton>

            <BFormText v-if="suggestedMinRole" class="text-warning">
                <PhosphorIcon name="info" :size="14" class="me-1" />
                {{
                    t('permissions.form.inheritHint', {
                        role: t(`permissions.roles.${suggestedMinRole}`),
                    })
                }}
            </BFormText>
        </BFormGroup>

        <!-- Role selection -->
        <BFormGroup
            :label="t('permissions.form.role')"
            label-class="fw-medium"
            class="mb-3"
        >
            <BFormSelect
                v-model="selectedRole"
                :options="roleOptions"
                text-field="label"
                value-field="value"
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
