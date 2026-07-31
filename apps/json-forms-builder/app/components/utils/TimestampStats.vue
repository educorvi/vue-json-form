<script setup lang="ts">
import IconTextDetail from '~/components/utils/IconTextDetail.vue';
import z from 'zod';
type Timestamp = z.infer<typeof z.iso.datetime>;

defineProps<{
    created?: Timestamp;
    updated?: Timestamp;
}>();

const { t, locale } = useI18n();
</script>

<template>
    <div class="d-flex flex-column text-secondary small">
        <IconTextDetail
            v-if="created"
            icon="calendar"
            :text="formatDate(created, false, locale)"
            :title="
                t('groups.created') + ': ' + formatDate(created, true, locale)
            "
        />
        <IconTextDetail
            v-if="updated"
            icon="clock-clockwise"
            :text="formatDate(updated, false, locale)"
            :title="
                t('groups.updated') + ': ' + formatDate(updated, true, locale)
            "
        />
    </div>
</template>
