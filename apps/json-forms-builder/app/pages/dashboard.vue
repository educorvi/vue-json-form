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

// ── Recently added forms (last 6) ────────────────────────────────────────

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
    <BasePageContainer>
        <DashboardWelcome :user-name="userName" />
        <DashboardRecentForms :forms="recentForms" :pending="recentPending" />
        <DashboardQuickActions />
        <DashboardDeveloper />
    </BasePageContainer>
</template>
