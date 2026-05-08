<script setup lang="ts">
const { user, clear: clearSession } = useUserSession();

async function logout() {
    await $fetch('/auth/logout', { method: 'POST' });
    await clearSession();
    await navigateTo('/login');
}

const menuItems = [
    { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard' },
    { label: 'Users', icon: 'pi pi-users', route: '/users' },
    {
        label: 'API Docs',
        icon: 'pi pi-code',
        url: '/_swagger',
        target: '_blank',
    },
];
</script>

<template>
    <div class="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-950">
        <Menubar
            :model="menuItems"
            class="rounded-none border-x-0 border-t-0 sticky top-0 z-50"
        >
            <template #start>
                <NuxtLink
                    to="/dashboard"
                    class="flex items-center gap-2 no-underline mr-4"
                >
                    <i class="pi pi-file-edit text-primary text-lg" />
                    <span class="font-semibold text-sm">Form Builder</span>
                </NuxtLink>
            </template>
            <template #item="{ item, props }">
                <NuxtLink
                    v-if="item.route"
                    :to="item.route"
                    v-bind="props.action"
                    class="no-underline flex items-center"
                >
                    <i :class="item.icon" />
                    <span class="ml-2">{{ item.label }}</span>
                </NuxtLink>
                <a
                    v-else
                    :href="item.url"
                    :target="item.target"
                    v-bind="props.action"
                    class="flex items-center"
                >
                    <i :class="item.icon" />
                    <span class="ml-2">{{ item.label }}</span>
                </a>
            </template>
            <template #end>
                <div class="flex items-center gap-3">
                    <span
                        v-if="user"
                        class="text-sm text-surface-500 hidden sm:block"
                    >
                        {{ (user as { name?: string }).name }}
                    </span>
                    <Button
                        label="Sign out"
                        icon="pi pi-sign-out"
                        size="small"
                        severity="secondary"
                        outlined
                        @click="logout"
                    />
                </div>
            </template>
        </Menubar>

        <main class="flex-1">
            <slot />
        </main>
    </div>
</template>
