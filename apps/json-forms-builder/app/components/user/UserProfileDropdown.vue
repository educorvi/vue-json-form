<script setup lang="ts">
const { t } = useI18n();
const { user, clear: clearSession } = useUserSession();

const userName = computed(() => (user as { name?: string })?.name ?? 'User');
const userRole = computed(() => (user as { role?: string })?.role ?? null);

function roleBadgeVariant(role: string): string {
    return role === 'admin' ? 'danger' : 'secondary';
}

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
        <PhosphorIcon name="user" />
        <div class="d-flex flex-column">
            <span class="fw-medium d-flex align-items-center gap-2">
                {{ userName }}
                <span
                    v-if="userRole"
                    :class="'badge bg-' + roleBadgeVariant(userRole)"
                    class="text-uppercase"
                    style="font-size: 0.6rem"
                >
                    {{ userRole }}
                </span>
            </span>
            <span class="small text-secondary">{{
                (user as { email?: string })?.email ?? ''
            }}</span>
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
    <BDropdownItem @click="logout" class="d-flex align-items-center gap-2">
        <PhosphorIcon name="sign-out" />
        {{ t('nav.signOut') }}
    </BDropdownItem>
</template>
