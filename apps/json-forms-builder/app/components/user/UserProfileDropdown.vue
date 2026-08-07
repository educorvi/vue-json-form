<script setup lang="ts">
import UserRoleCell from '~/components/user/UserRoleCell.vue';

const { t } = useI18n();
const { user, clear: clearSession } = useUserSession();

const userName = computed(() => user.value?.username ?? 'User');
const userRole = computed(() =>
    user.value ? (user.value.roles.includes('admin') ? 'admin' : 'user') : null
);

async function logout() {
    await $fetch('/auth/logout', { method: 'POST' });
    await clearSession();
    await navigateTo('/');
}
</script>

<template>
    <li
        class="dropdown-item d-flex align-items-center gap-2"
        style="cursor: default"
    >
        <Icon name="ph:user" />
        <div class="d-flex flex-column">
            <span class="fw-medium d-flex align-items-center gap-2">
                {{ userName }}
                <UserRoleCell v-if="userRole" :role="userRole" />
            </span>
            <span class="small text-secondary">{{ user?.email ?? '' }}</span>
        </div>
    </li>
    <BDropdownDivider />
    <li class="px-3 py-1" @click.stop>
        <label class="form-label small text-secondary mb-1 d-block">
            {{ t('theme.label') }}
        </label>
        <ThemeSwitcher class="w-100" />
    </li>
    <li class="px-3 py-1" @click.stop>
        <label class="form-label small text-secondary mb-1 d-block">
            {{ t('locale.label') }}
        </label>
        <LocaleSwitcher class="w-100" />
    </li>
    <BDropdownDivider />
    <BDropdownItem class="d-flex align-items-center gap-2" @click="logout">
        <Icon name="ph:sign-out" />
        {{ t('nav.signOut') }}
    </BDropdownItem>
</template>
