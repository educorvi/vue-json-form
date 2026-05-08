<script setup lang="ts">
import type { AppRouter } from '~~/server/trpc/routers';
import { createTRPCNuxtClient } from 'trpc-nuxt/client';

definePageMeta({ middleware: ['authenticated'] });

const { user, clear: clearSession } = useUserSession();
const trpc = useNuxtApp().$trpc as unknown as ReturnType<
    typeof createTRPCNuxtClient<AppRouter>
>;

const {
    data: status,
    pending,
    error,
} = await useAsyncData('status', () => trpc.status.get.query());

async function logout() {
    await $fetch('/auth/logout', { method: 'POST' });
    await clearSession();
    await navigateTo('/login');
}
</script>

<template>
    <div class="min-h-screen bg-surface-50 dark:bg-surface-900 p-6">
        <div class="max-w-3xl mx-auto">
            <div class="flex items-start justify-between mb-8">
                <div>
                    <h1
                        class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-1"
                    >
                        Form Builder
                    </h1>
                    <p class="text-surface-400">
                        Administrative interface for managing forms, users, and
                        permissions.
                    </p>
                </div>
                <div class="flex items-center gap-3">
                    <span
                        v-if="user"
                        class="text-sm text-surface-500 dark:text-surface-400"
                        >{{ (user as { name?: string }).name }}</span
                    >
                    <Button
                        label="Sign out"
                        icon="pi pi-sign-out"
                        severity="secondary"
                        size="small"
                        @click="logout"
                    />
                </div>
            </div>

            <!-- Status card -->
            <Card class="mb-6 shadow-sm">
                <template #title>
                    <span
                        class="text-base font-semibold text-surface-700 dark:text-surface-200"
                        >API Status</span
                    >
                </template>
                <template #content>
                    <div v-if="pending" class="flex items-center gap-3">
                        <Skeleton
                            width="5rem"
                            height="1.5rem"
                            border-radius="9999px"
                        />
                        <Skeleton width="4rem" height="1rem" />
                    </div>
                    <div
                        v-else-if="error"
                        class="flex items-center gap-2 text-red-500"
                    >
                        <i class="pi pi-exclamation-triangle" />
                        Could not reach API: {{ error.message }}
                    </div>
                    <div v-else-if="status" class="flex items-center gap-4">
                        <Tag
                            :value="status.status.toUpperCase()"
                            :severity="
                                status.status === 'ok'
                                    ? 'success'
                                    : status.status === 'degraded'
                                      ? 'warn'
                                      : 'danger'
                            "
                        />
                        <span class="text-sm text-surface-400"
                            >v{{ status.version }}</span
                        >
                        <span class="text-sm text-surface-400">{{
                            new Date(status.timestamp).toLocaleString()
                        }}</span>
                    </div>
                </template>
            </Card>

            <!-- Navigation cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NuxtLink to="/users" class="no-underline">
                    <Card
                        class="hover:shadow-md transition-shadow cursor-pointer border border-surface-200 dark:border-surface-700"
                    >
                        <template #content>
                            <div class="flex items-start gap-4">
                                <div
                                    class="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0"
                                >
                                    <i
                                        class="pi pi-users text-primary-500 text-lg"
                                    />
                                </div>
                                <div>
                                    <p
                                        class="font-semibold text-surface-800 dark:text-surface-100 mb-0.5"
                                    >
                                        Users
                                    </p>
                                    <p class="text-sm text-surface-400">
                                        Manage system users, roles, and access.
                                    </p>
                                </div>
                            </div>
                        </template>
                    </Card>
                </NuxtLink>

                <a href="/_swagger" target="_blank" class="no-underline">
                    <Card
                        class="hover:shadow-md transition-shadow cursor-pointer border border-surface-200 dark:border-surface-700"
                    >
                        <template #content>
                            <div class="flex items-start gap-4">
                                <div
                                    class="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0"
                                >
                                    <i
                                        class="pi pi-code text-emerald-500 text-lg"
                                    />
                                </div>
                                <div>
                                    <p
                                        class="font-semibold text-surface-800 dark:text-surface-100 mb-0.5"
                                    >
                                        API Docs
                                    </p>
                                    <p class="text-sm text-surface-400">
                                        Browse and test the REST API via Swagger
                                        UI.
                                    </p>
                                </div>
                            </div>
                        </template>
                    </Card>
                </a>
            </div>
        </div>
    </div>
</template>
