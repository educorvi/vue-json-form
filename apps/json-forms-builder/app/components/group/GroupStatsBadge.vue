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
        <BTooltip triggers="hover">
            <template #target>
                <span class="d-inline-flex align-items-center gap-1">
                    <PhosphorIcon name="folders" :size="14" />
                    {{ groupCount }}
                </span>
            </template>
            {{ t('groups.subGroups') }}
        </BTooltip>
        <BTooltip triggers="hover">
            <template #target>
                <span class="d-inline-flex align-items-center gap-1">
                    <PhosphorIcon name="file-text" :size="14" />
                    {{ formCount }}
                </span>
            </template>
            {{ t('groups.forms') }}
        </BTooltip>
        <BTooltip triggers="hover">
            <template #target>
                <span class="d-inline-flex align-items-center gap-1">
                    <PhosphorIcon name="users" :size="14" />
                    {{ memberCount }}
                </span>
            </template>
            {{ t('groups.members') }}
        </BTooltip>
    </div>
</template>
