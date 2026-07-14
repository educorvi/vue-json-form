<!--
    GroupSettingsAdvanced – Advanced section for the group edit page.
-->
<script setup lang="ts">
const emit = defineEmits<{
    delete: [];
}>();
</script>

<template>
    <SettingsSection
        :title="$t('settings.advanced')"
        :description="$t('settings.advancedDescription')"
    >
        <BButton variant="outline-danger" @click="emit('delete')">
            <PhosphorIcon name="trash" :size="16" class="me-1" />
            {{ $t('groups.delete.title') }}
        </BButton>
    </SettingsSection>
</template>
