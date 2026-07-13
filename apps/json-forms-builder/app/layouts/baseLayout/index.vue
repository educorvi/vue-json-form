<script setup lang="ts">
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
    {
        label: t('nav.forms'),
        icon: 'ph ph-objects-column',
        route: '/form-builder',
    },
    { label: t('nav.users'), icon: 'ph ph-users', route: '/users' },
    { label: t('nav.groups'), icon: 'ph ph-tree-structure', route: '/groups' },
]);

const userName = computed(() => (user as { name?: string })?.name ?? 'User');
</script>

<template>
    <div class="d-flex flex-column vh-100 bg-body-tertiary">
        <Header />
        <main class="d-flex flex-column flex-grow-1 overflow-y-auto">
            <slot />
        </main>
        <!-- <Footer /> -->
    </div>
</template>
