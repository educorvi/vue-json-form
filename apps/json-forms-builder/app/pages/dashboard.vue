<script setup lang="ts">
/**
 * /dashboard — Home / Start page for authenticated users.
 */
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';

definePageMeta({ middleware: ['authenticated'], layout: 'base-layout' });

const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;

const { user } = useUserSession();
const userName = computed(() => (user as { name?: string })?.name ?? 'User');

// ── Recently added forms ────────────────────────────────────────

const { data: recentData, pending: recentPending } = useLazyAsyncData(
    'dashboard-recent-forms',
    () =>
        orpc.forms.list({
            query: {
                page: 1,
                page_size: 6,
                sort_order: 'desc',
                order_by: 'created' as const,
            },
        }),
    { default: () => ({ data: [], total_count: 0 }) }
);

const recentForms = computed<any[]>(
    () => (recentData.value?.data ?? []) as any[]
);
</script>

<template>
    <BasePage
        :title="`${$t('dashboard.welcomeTitle', { name: userName })}`"
        :description="$t('dashboard.welcomeDescription')"
    >
        <template #icon>
            <div
                class="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10"
                style="width: 64px; height: 64px; flex-shrink: 0"
            >
                <PhosphorIcon
                    name="user-circle"
                    :size="36"
                    class="text-primary"
                />
            </div>
        </template>

        <DashboardRecentForms :forms="recentForms" :pending="recentPending" />
        <DashboardQuickActions />
        <DashboardDeveloper />
    </BasePage>
</template>
