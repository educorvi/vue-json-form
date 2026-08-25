<script setup lang="ts">
import SettingsSection from '@/components/shared/SettingsSection.vue';
import FieldSelect from '@/components/shared/fields/FieldSelect.vue';
import { EnumFormat } from '@educorvi/vue-json-forms-builder-schemas';
import { useElementSettings } from './useElementSettings';
import SelectionElementSettings from './SelectionElementSettings.vue';

const { enumField } = useElementSettings();

const format = enumField('format', EnumFormat.Select);
const formatOptions = Object.values(EnumFormat);
</script>

<template>
    <!-- inherited options (SelectionElement → SimpleElement → BaseDataElement) -->
    <SelectionElementSettings />

    <!-- Enum-specific: how the select is rendered -->
    <SettingsSection title="Enum" icon="bi bi-list-ul" :collapsible="true">
        <FieldSelect
            v-model="format"
            label="Format"
            :options="formatOptions"
            field-name="format"
        />
    </SettingsSection>
</template>
