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
        <span
            class="d-inline-flex align-items-center gap-1"
            v-b-tooltip="`${t('users.created')}: ${formatDate(created)}`"
        >
            <span class="d-inline-flex align-items-center">
                <PhosphorIcon name="calendar" :size="14" />
            </span>
            {{ formatDate(created) }}
        </span>
        <span
            class="d-inline-flex align-items-center gap-1"
            v-b-tooltip="`${t('users.lastActivity')}: ${formatDate(updated)}`"
        >
            <span class="d-inline-flex align-items-center">
                <PhosphorIcon name="clock" :size="14" />
            </span>
            {{ formatDate(updated) }}
        </span>
    </div>
</template>
