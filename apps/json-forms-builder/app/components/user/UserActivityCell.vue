<script setup lang="ts">
import { formatDate } from '~~/app/utils/date';

defineProps<{
    created: string;
    updated: string;
}>();

const { t } = useI18n();
</script>

<template>
    <div class="d-flex flex-column small text-secondary">
        <span class="d-inline-flex align-items-center gap-1">
            <span
                v-b-tooltip.html="
                    `${t('users.created')}: ${formatDate(created)}`
                "
                class="d-inline-flex align-items-center cursor-help"
                :aria-label="`${t('users.created')}: ${formatDate(created)}`"
            >
                <PhosphorIcon name="calendar" :size="14" />
            </span>
            {{ formatDate(created) }}
        </span>
        <span class="d-inline-flex align-items-center gap-1">
            <span
                v-b-tooltip.html="
                    `${t('users.lastActivity')}: ${formatDate(updated)}`
                "
                class="d-inline-flex align-items-center cursor-help"
                :aria-label="`${t('users.lastActivity')}: ${formatDate(updated)}`"
            >
                <PhosphorIcon name="clock" :size="14" />
            </span>
            {{ formatDate(updated) }}
        </span>
    </div>
</template>
