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
            v-b-tooltip.hover
            :title="t('groups.subGroups')"
            class="d-inline-flex align-items-center gap-1"
            style="cursor: help"
        >
            <PhosphorIcon name="folders" :size="14" />
            {{ groupCount }}
        </span>
        <span
            v-b-tooltip.hover
            :title="t('groups.forms')"
            class="d-inline-flex align-items-center gap-1"
            style="cursor: help"
        >
            <PhosphorIcon name="file-text" :size="14" />
            {{ formCount }}
        </span>
        <span
            v-b-tooltip.hover
            :title="t('groups.members')"
            class="d-inline-flex align-items-center gap-1"
            style="cursor: help"
        >
            <PhosphorIcon name="users" :size="14" />
            {{ memberCount }}
        </span>
    </div>
</template>
