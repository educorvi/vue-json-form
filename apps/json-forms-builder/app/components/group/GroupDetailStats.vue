<script setup lang="ts">
import IconTextDetail from '~/components/utils/IconTextDetail.vue';
import z from 'zod';
import type { zChildGroup } from '~~/server/orpc/generated/zod.gen';

/**
 * GroupStats — Shows inline statistics for a group
 * using icons only, with tooltips for the text labels.
 */

type ChildGroup = z.infer<typeof zChildGroup>;

function formatTimestamp(iso: string | undefined): string {
    if (!iso) return '';
    const date = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(date);
}

defineProps<{
    childGroup: ChildGroup;
}>();

const { t } = useI18n();
</script>

<template>
    <div class="d-flex align-items-center gap-1 text-secondary small">
        <IconTextDetail
            icon="folders"
            :text="childGroup.group_count"
            :title="t('groups.subGroups')"
        />
        <IconTextDetail
            icon="file-text"
            :text="childGroup.form_count"
            :title="t('groups.forms')"
        />
        <IconTextDetail
            icon="users"
            :text="childGroup.member_count"
            :title="t('groups.members')"
        />
    </div>
</template>
