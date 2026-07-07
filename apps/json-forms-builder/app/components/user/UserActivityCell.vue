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
            <BTooltip triggers="hover">
                <template #target>
                    <span class="d-inline-flex align-items-center">
                        <PhosphorIcon name="calendar" :size="14" />
                    </span>
                </template>
                {{ t('users.created') }}: {{ formatDate(created) }}
            </BTooltip>
            {{ formatDate(created) }}
        </span>
        <span class="d-inline-flex align-items-center gap-1">
            <BTooltip triggers="hover">
                <template #target>
                    <span class="d-inline-flex align-items-center">
                        <PhosphorIcon name="clock" :size="14" />
                    </span>
                </template>
                {{ t('users.lastActivity') }}: {{ formatDate(updated) }}
            </BTooltip>
            {{ formatDate(updated) }}
        </span>
    </div>
</template>
