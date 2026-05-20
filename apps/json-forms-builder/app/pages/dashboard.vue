<script setup lang="ts">
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';

definePageMeta({ middleware: ['authenticated'], layout: 'default' });

const { t } = useI18n();
const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;

// Upsert the current user in the DB from their Keycloak claims.
// TODO: only do once after login and not all the time...
orpc.users.create().catch((err) => console.warn('[users.create]', err));

const {
    data: status,
    pending,
    error,
} = await useAsyncData('status', () => orpc.status.get());
</script>

<template>
    <div class="p-6">
        <div class="max-w-5xl mx-auto">
            <div class="mb-8">
                <h1
                    class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-1"
                >
                    {{ t('dashboard.title') }}
                </h1>
                <p class="text-surface-400">
                    {{ t('dashboard.subtitle') }}
                </p>
            </div>

            <!-- Status card -->
            <Card class="mb-6">
                <template #title>
                    <span
                        class="text-base font-semibold text-surface-700 dark:text-surface-200"
                        >{{ t('dashboard.apiStatus') }}</span
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
                        {{ t('dashboard.apiError') }} {{ error.message }}
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
                        <ClientOnly>
                            <span class="text-sm text-surface-400">{{
                                new Date(status.timestamp).toLocaleString()
                            }}</span>
                        </ClientOnly>
                    </div>
                </template>
            </Card>

            <!-- Navigation cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NuxtLink to="/users" class="no-underline">
                    <Card>
                        <template #content>
                            <div class="flex items-start gap-4">
                                <div
                                    class="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0"
                                >
                                    <i
                                        class="pi pi-users text-emerald-500 text-lg"
                                    />
                                </div>
                                <div>
                                    <p
                                        class="font-semibold text-surface-800 dark:text-surface-100 mb-0.5"
                                    >
                                        {{ t('dashboard.navUsers') }}
                                    </p>
                                    <p class="text-sm text-surface-400">
                                        {{ t('dashboard.navUsersDesc') }}
                                    </p>
                                </div>
                            </div>
                        </template>
                    </Card>
                </NuxtLink>

                <a href="/_swagger" target="_blank" class="no-underline">
                    <Card>
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
                                        {{ t('dashboard.navApiDocs') }}
                                    </p>
                                    <p class="text-sm text-surface-400">
                                        {{ t('dashboard.navApiDocsDesc') }}
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
