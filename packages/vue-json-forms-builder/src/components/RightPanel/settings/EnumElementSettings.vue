<script setup lang="ts">
import SettingsSection from '@/components/shared/SettingsSection.vue';
import FieldSelect from '@/components/shared/fields/FieldSelect.vue';
import { useElementSettings } from './useElementSettings';
import SelectionElementSettings from './SelectionElementSettings.vue';
import { EnumFormatOptions } from '@educorvi/vue-json-forms-builder-schemas';

const { enumField } = useElementSettings();

const format = enumField('format', 'select');
const formatOptions = Object.values(EnumFormatOptions);
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
