<script setup lang="ts">
/**
 * GroupStatsBadge — Shows inline statistics for a group
 * using icons only, with tooltips for the text labels.
 */
defineProps<{
    groupCount: number;
    formCount: number;
    memberCount: number;
}>();

const { t } = useI18n();
</script>

<template>
    <div class="d-flex align-items-center gap-1 text-secondary small">
        <span
            class="d-inline-flex align-items-center gap-1"
            v-b-tooltip="t('groups.subGroups')"
        >
            <PhosphorIcon name="folders" :size="14" />
            {{ groupCount }}
        </span>
        <span
            class="d-inline-flex align-items-center gap-1"
            v-b-tooltip="t('groups.forms')"
        >
            <PhosphorIcon name="file-text" :size="14" />
            {{ formCount }}
        </span>
        <span
            class="d-inline-flex align-items-center gap-1"
            v-b-tooltip="t('groups.members')"
        >
            <PhosphorIcon name="users" :size="14" />
            {{ memberCount }}
        </span>
    </div>
</template>
