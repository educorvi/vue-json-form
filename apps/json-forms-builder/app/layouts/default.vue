<script setup lang="ts">
import { ref } from 'vue';

const { t } = useI18n();
const { user, clear: clearSession } = useUserSession();

async function logout() {
    await $fetch('/auth/logout', { method: 'POST' });
    await clearSession();
    await navigateTo('/login');
}

const navItems = computed(() => [
    { label: t('nav.dashboard'), icon: 'pi pi-home', route: '/dashboard' },
    { label: t('nav.users'), icon: 'pi pi-users', route: '/users' },
    { label: t('nav.groups'), icon: 'pi pi-sitemap', route: '/groups' },
    {
        label: t('nav.formBuilder'),
        icon: 'pi pi-objects-column',
        route: '/form-builder',
    },
    {
        label: t('nav.apiDocs'),
        icon: 'pi pi-code',
        url: '/_swagger',
        target: '_blank',
    },
]);

// Popover for user account menu
const userPopover = ref();

function toggleUserPopover(event: Event) {
    userPopover.value.toggle(event);
}
</script>

<template>
    <div class="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-950">
        <Menubar
            :model="navItems"
            class="rounded-none border-x-0 border-t-0 sticky top-0 z-50 px-4 py-2"
        >
            <template #start>
                <NuxtLink
                    to="/dashboard"
                    class="flex items-center gap-2 no-underline mr-6"
                >
                    <i class="pi pi-file-edit text-primary text-xl" />
                    <span class="font-semibold text-sm">Form Builder</span>
                </NuxtLink>
            </template>
            <template #item="{ item, props }">
                <NuxtLink
                    v-if="item.route"
                    :to="item.route"
                    v-bind="props.action"
                    class="no-underline flex items-center gap-2 px-3 py-2"
                >
                    <i :class="item.icon" />
                    <span>{{ item.label }}</span>
                </NuxtLink>
                <a
                    v-else
                    :href="item.url"
                    :target="item.target"
                    v-bind="props.action"
                    class="flex items-center gap-2 px-3 py-2"
                >
                    <i :class="item.icon" />
                    <span>{{ item.label }}</span>
                </a>
            </template>
            <template #end>
                <div class="flex items-center gap-1">
                    <template v-if="user">
                        <Button
                            text
                            rounded
                            class="flex items-center gap-2 px-2"
                            aria-haspopup="true"
                            aria-controls="user-popover"
                            @click="toggleUserPopover"
                        >
                            <i class="pi pi-user text-base" />
                            <span class="text-sm hidden sm:inline">{{
                                (user as { name?: string }).name
                            }}</span>
                            <i
                                class="pi pi-chevron-down text-xs text-surface-400"
                            />
                        </Button>
                        <Popover id="user-popover" ref="userPopover">
                            <div class="flex flex-col gap-3 min-w-52 p-1">
                                <!-- User info -->
                                <div class="flex items-center gap-2 px-1">
                                    <i class="pi pi-user text-surface-400" />
                                    <span class="font-medium text-sm">{{
                                        (user as { name?: string }).name
                                    }}</span>
                                </div>

                                <Divider class="my-0" />

                                <!-- Theme -->
                                <div
                                    class="flex items-center justify-between px-1"
                                >
                                    <span
                                        class="text-sm text-surface-600 dark:text-surface-300"
                                        >{{ t('theme.system') }}</span
                                    >
                                    <LazyThemeSwitcher />
                                </div>

                                <!-- Design System -->
                                <!-- <div
                                    class="flex items-center justify-between px-1"
                                >
                                    <span
                                        class="text-sm text-surface-600 dark:text-surface-300"
                                        >{{ t('designSystem.label') }}</span
                                    >
                                    <DesignSystemSwitcher />
                                </div> -->

                                <!-- Language -->
                                <div class="flex flex-col gap-1 px-1">
                                    <span
                                        class="text-sm text-surface-600 dark:text-surface-300"
                                        >{{ t('locale.label') }}</span
                                    >
                                    <LazyLocaleSwitcher />
                                </div>

                                <Divider class="my-0" />

                                <!-- Sign out -->
                                <Button
                                    :label="t('nav.signOut')"
                                    icon="pi pi-sign-out"
                                    severity="secondary"
                                    variant="text"
                                    class="w-full justify-start"
                                    @click="logout"
                                />
                            </div>
                        </Popover>
                    </template>
                </div>
            </template>
        </Menubar>

        <main class="flex-1">
            <slot />
        </main>
    </div>
</template>
