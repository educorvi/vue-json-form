<script setup lang="ts">
const { user, clear: clearSession } = useUserSession();

async function logout() {
    await $fetch('/auth/logout', { method: 'POST' });
    await clearSession();
    await navigateTo('/login');
}

const menuItems = [
    { label: 'Dashboard', icon: 'home', route: '/dashboard' },
    { label: 'Users', icon: 'users', route: '/users' },
    {
        label: 'API Docs',
        icon: 'code',
        url: '/_swagger',
        target: '_blank',
    },
];

import UserProfile from '../components/UserProfile.vue';
import { ref, defineComponent, h } from 'vue';
const showProfile = ref(false);

const HomeIcon = defineComponent({
    name: 'HomeIcon',
    render() {
        return h(
            'svg',
            {
                xmlns: 'http://www.w3.org/2000/svg',
                viewBox: '0 0 24 24',
                class: 'w-5 h-5',
            },
            [
                h('g', { id: 'home' }, [
                    h('path', {
                        d: 'M20,11.75a.74.74,0,0,1-.45-.15L12,5.94,4.45,11.6a.75.75,0,0,1-.9-1.2l8-6a.75.75,0,0,1,.9,0l8,6a.75.75,0,0,1,.15,1A.74.74,0,0,1,20,11.75Z',
                    }),
                    h('path', {
                        d: 'M18,19.75H6A.76.76,0,0,1,5.25,19V9.5a.75.75,0,0,1,1.5,0v8.75h10.5V9.5a.75.75,0,0,1,1.5,0V19A.76.76,0,0,1,18,19.75Z',
                    }),
                    h('path', {
                        d: 'M14,19.75a.76.76,0,0,1-.75-.75V12.75h-2.5V19a.75.75,0,0,1-1.5,0V12a.76.76,0,0,1,.75-.75h4a.76.76,0,0,1,.75.75v7A.76.76,0,0,1,14,19.75Z',
                    }),
                ]),
            ]
        );
    },
});
const UsersIcon = defineComponent({
    name: 'UsersIcon',
    render() {
        return h(
            'svg',
            {
                xmlns: 'http://www.w3.org/2000/svg',
                viewBox: '0 0 24 24',
                class: 'w-5 h-5',
            },
            [
                h('g', { id: 'users' }, [
                    h('path', {
                        d: 'M14,12.25A3.75,3.75,0,1,1,17.75,8.5,3.75,3.75,0,0,1,14,12.25Zm0-6A2.25,2.25,0,1,0,16.25,8.5,2.25,2.25,0,0,0,14,6.25Z',
                    }),
                    h('path', {
                        d: 'M21,19.25a.76.76,0,0,1-.75-.75c0-1.95-1.06-3.25-6.25-3.25s-6.25,1.3-6.25,3.25a.75.75,0,0,1-1.5,0c0-4.75,5.43-4.75,7.75-4.75s7.75,0,7.75,4.75A.76.76,0,0,1,21,19.25Z',
                    }),
                    h('path', {
                        d: 'M8.32,13.06H8a3,3,0,1,1,.58-6,.75.75,0,1,1-.15,1.49,1.46,1.46,0,0,0-1.09.34,1.47,1.47,0,0,0-.54,1,1.49,1.49,0,0,0,1.35,1.64,1.53,1.53,0,0,0,.93-.22.75.75,0,0,1,.79,1.28A3,3,0,0,1,8.32,13.06Z',
                    }),
                    h('path', {
                        d: 'M3,18.5a.76.76,0,0,1-.75-.75c0-2.7.72-4.5,4.25-4.5a.75.75,0,0,1,0,1.5c-2.35,0-2.75.75-2.75,3A.76.76,0,0,1,3,18.5Z',
                    }),
                ]),
            ]
        );
    },
});
const CodeIcon = defineComponent({
    name: 'CodeIcon',
    render() {
        return h(
            'svg',
            {
                xmlns: 'http://www.w3.org/2000/svg',
                viewBox: '0 0 24 24',
                class: 'w-5 h-5',
            },
            [
                h('g', { id: 'code' }, [
                    h('path', {
                        d: 'M9.53,6.47a.75.75,0,0,0-1.06,0l-5,5a.75.75,0,0,0,0,1.06l5,5a.75.75,0,0,0,1.06,0,.75.75,0,0,0,0-1.06L5.06,12,9.53,7.53A.75.75,0,0,0,9.53,6.47Z',
                    }),
                    h('path', {
                        d: 'M20.53,11.47l-5-5a.75.75,0,0,0-1.06,1.06L18.94,12l-4.47,4.47a.75.75,0,0,0,0,1.06.75.75,0,0,0,1.06,0l5-5A.75.75,0,0,0,20.53,11.47Z',
                    }),
                ]),
            ]
        );
    },
});
const UserIcon = defineComponent({
    name: 'UserIcon',
    render() {
        return h(
            'svg',
            {
                xmlns: 'http://www.w3.org/2000/svg',
                viewBox: '0 0 24 24',
                class: 'w-5 h-5',
            },
            [
                h('g', { id: 'user' }, [
                    h('path', {
                        d: 'M12,12.25A3.75,3.75,0,1,1,15.75,8.5,3.75,3.75,0,0,1,12,12.25Zm0-6A2.25,2.25,0,1,0,14.25,8.5,2.25,2.25,0,0,0,12,6.25Z',
                    }),
                    h('path', {
                        d: 'M19,19.25a.76.76,0,0,1-.75-.75c0-1.95-1.06-3.25-6.25-3.25s-6.25,1.3-6.25,3.25a.75.75,0,0,1-1.5,0c0-4.75,5.43-4.75,7.75-4.75s7.75,0,7.75,4.75A.76.76,0,0,1,19,19.25Z',
                    }),
                ]),
            ]
        );
    },
});

function getIconComponent(name: string) {
    switch (name) {
        case 'home':
            return HomeIcon;
        case 'users':
            return UsersIcon;
        case 'code':
            return CodeIcon;
        case 'user':
            return UserIcon;
        default:
            return null;
    }
}
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
                    <span
                        class="text-primary text-lg w-6 h-6 flex items-center justify-center"
                    >
                        <!-- file-edit.svg -->
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            class="w-6 h-6"
                        >
                            <path
                                d="M8,18.75h-1.5c-.69,0-1.25-.56-1.25-1.25V5.5c0-.69,.56-1.25,1.25-1.25h3.75v4.75c0,.41,.34,.75,.75,.75h4.8c.1,.29,.37,.5,.7,.5,.41,0,.75-.34,.75-.75v-.5c0-.1-.02-.2-.06-.29-.04-.09-.09-.17-.16-.24L11.53,2.97c-.07-.07-.15-.12-.24-.16-.09-.04-.19-.06-.29-.06H6.5c-1.52,0-2.75,1.23-2.75,2.75v12c0,1.52,1.23,2.75,2.75,2.75h1.5c.41,0,.75-.34,.75-.75s-.34-.75-.75-.75Zm3.75-13.44l2.94,2.94h-2.94v-2.94Zm7.86,6.06c-.38-.38-.94-.61-1.52-.62-.6-.03-1.17,.2-1.55,.59l-6.39,6.4c-.13,.13-.2,.29-.22,.47l-.18,2.23c-.02,.22,.06,.44,.22,.59,.14,.14,.33,.22,.53,.22,.02,0,.04,0,.07,0l2.25-.21c.17-.02,.34-.09,.46-.22l6.39-6.4c.8-.79,.77-2.22-.06-3.05Zm-1,1.99l-6.2,6.21-1.09,.1,.08-1.06,6.2-6.21h0c.1-.1,.28-.14,.46-.15,.2,0,.38,.07,.49,.18,.24,.23,.27,.72,.06,.93Z"
                            />
                        </svg>
                    </span>
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
                    <span class="w-5 h-5 flex items-center justify-center">
                        <component :is="getIconComponent(item.icon || '')" />
                    </span>
                    <span class="ml-2">{{ item.label }}</span>
                </NuxtLink>
                <a
                    v-else
                    :href="item.url"
                    :target="item.target"
                    v-bind="props.action"
                    class="flex items-center"
                >
                    <span class="w-5 h-5 flex items-center justify-center">
                        <component :is="getIconComponent(item.icon || '')" />
                    </span>
                    <span class="ml-2">{{ item.label }}</span>
                </a>
            </template>
            <template #end>
                <div class="relative flex items-center gap-3">
                    <button
                        v-if="user"
                        @click="showProfile = !showProfile"
                        class="flex items-center gap-2 focus:outline-none"
                    >
                        <span
                            class="w-7 h-7 flex items-center justify-center rounded-full bg-surface-200 dark:bg-surface-800"
                        >
                            <UserIcon class="w-5 h-5 text-surface-600" />
                        </span>
                        <span
                            class="text-sm text-surface-700 dark:text-surface-200 hidden sm:block"
                            >{{ (user as { name?: string }).name }}</span
                        >
                    </button>
                    <div
                        v-if="showProfile"
                        class="absolute right-0 mt-2 z-50 bg-white dark:bg-surface-900 rounded shadow-lg border p-0.5 min-w-[200px]"
                        @click.outside="showProfile = false"
                    >
                        <UserProfile :user="user || {}" @logout="logout" />
                    </div>
                </div>
            </template>
        </Menubar>

        <main class="flex-1">
            <slot />
        </main>
    </div>
</template>
