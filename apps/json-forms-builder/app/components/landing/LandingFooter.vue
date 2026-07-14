<script setup lang="ts">
import { APP_LINKS } from '@/utils/links';

const { t } = useI18n();
const orpc = useNuxtApp().$orpc;
const { data: apiStatus, error: apiStatusError } = useLazyAsyncData(
    'api-status',
    () => orpc.status.get()
);
</script>

<template>
    <footer class="bg-body border-top px-4 py-4 text-center">
        <div class="d-flex justify-content-center align-items-center gap-3">
            <span class="text-secondary small">
                {{ t('landing.footer') }}
            </span>
            <a
                :href="APP_LINKS.github"
                target="_blank"
                rel="noopener noreferrer"
                class="d-inline-flex align-items-center gap-1 text-secondary small text-decoration-none"
                data-testid="github-link"
            >
                <PhosphorIcon name="github-logo" :size="16" />
                GitHub
            </a>
        </div>
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
