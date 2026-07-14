<script setup lang="ts">
import IconTextDetail from '~/components/utils/IconTextDetail.vue';
import z from 'zod';
type Timestamp = z.infer<typeof z.iso.datetime>;

defineProps<{
    created?: Timestamp;
    updated?: Timestamp;
}>();

const { t } = useI18n();
</script>

<template>
    <div class="d-flex flex-column text-secondary small">
        <IconTextDetail
            v-if="created"
            icon="calendar"
            :text="formatDate(created)"
            :title="t('groups.created') + ': ' + formatDate(created, true)"
        />
        <IconTextDetail
            v-if="updated"
            icon="clock-clockwise"
            :text="formatDate(updated)"
            :title="t('groups.updated') + ': ' + formatDate(updated, true)"
        />
    </div>
</template>
