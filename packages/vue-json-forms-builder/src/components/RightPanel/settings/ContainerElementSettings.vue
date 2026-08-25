<script setup lang="ts">
import SettingsSection from '@/components/shared/SettingsSection.vue';
import FieldCheck from '@/components/shared/fields/FieldCheck.vue';
import { useElementSettings } from './useElementSettings';
import BaseDataElementSettings from './BaseDataElementSettings.vue';
import LayoutSection from './LayoutSection.vue';

const { booleanField } = useElementSettings();

const showTitle = booleanField('showTitle', true);
</script>

<template>
    <!-- inherited options (BaseDataElement) -->
    <BaseDataElementSettings />

    <!-- Layout: vertical/horizontal, inherited by ArrayElement + ObjectElement -->
    <LayoutSection />

    <!-- Container: inherited by ArrayElement + ObjectElement -->
    <SettingsSection title="Container" icon="bi bi-box" :collapsible="true">
        <FieldCheck
            v-model="showTitle"
            label="Show title"
            field-name="showTitle"
        />
    </SettingsSection>
</template>
