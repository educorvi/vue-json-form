<script setup lang="ts">
const { t } = useI18n();
const orpc = useNuxtApp().$orpc;
const { data: apiStatus, error: apiStatusError } = await useAsyncData(
    'api-status',
    () => orpc.status.get()
);
</script>

<template>
    <footer class="bg-body border-top px-4 py-4 text-center">
        <span class="text-secondary small">
            {{ t('landing.footer') }}
        </span>
        <div class="mt-2 small font-monospace" data-testid="api-status">
            <template v-if="apiStatusError">
                <span class="text-danger"
                    >API error: {{ apiStatusError.message }}</span
                >
            </template>
            <template v-else-if="apiStatus">
                <span class="text-success">v{{ apiStatus.version }}</span>
            </template>
        </div>
    </footer>
</template>
