<script setup lang="ts">
import { PhNotePencil, PhUser, PhSignOut } from '@phosphor-icons/vue';
import Header from './header.vue';
import Footer from './footer.vue';

const { t } = useI18n();
const { user, clear: clearSession } = useUserSession();

async function logout() {
    await $fetch('/auth/logout', { method: 'POST' });
    await clearSession();
    await navigateTo('/');
}

const navItems = computed(() => [
    { label: t('nav.dashboard'), icon: 'ph ph-house', route: '/dashboard' },
    { label: t('nav.users'), icon: 'ph ph-users', route: '/users' },
    { label: t('nav.groups'), icon: 'ph ph-tree-structure', route: '/groups' },
    {
        label: t('nav.formBuilder'),
        icon: 'ph ph-objects-column',
        route: '/form-builder',
    },
    {
        label: t('nav.apiDocs'),
        icon: 'ph ph-code',
        route: '/_swagger',
    },
]);

const userName = computed(() => (user as { name?: string })?.name ?? 'User');
</script>

<template>
    <div min-vh-100 d-flex flex-column bg-body-tertiary>
        <Header />
        <main class="flex-1 overflow-y-auto">
            <slot />
        </main>
        <!-- <Footer /> -->
    </div>
</template>
