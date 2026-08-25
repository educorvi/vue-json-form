<script setup lang="ts">
import { computed } from 'vue';
import SettingsSection from '@/components/shared/SettingsSection.vue';
import FieldTextarea from '@/components/shared/fields/FieldTextarea.vue';
import { SelectionElement } from '@educorvi/vue-json-forms-builder-schemas';
import { useElementSettings } from './useElementSettings';
import SimpleElementSettings from './SimpleElementSettings.vue';

const { element, setField } = useElementSettings();

const valuesText = computed({
    get: () => {
        const el = element.value;
        return el instanceof SelectionElement ? el.data.values.join('\n') : '';
    },
    set: (v: string) => {
        const values = v
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean);
        setField('values', values);
    },
});
</script>

<template>
    <!-- inherited options (SimpleElement → BaseDataElement) -->
    <SimpleElementSettings />

    <!-- Selection options: inherited by EnumElement + CheckboxGroupElement -->
    <SettingsSection title="Selection" icon="bi bi-list" :collapsible="true">
        <FieldTextarea
            v-model="valuesText"
            label="Options (one per line)"
            :rows="4"
            placeholder="option1&#10;option2"
            field-name="values"
        />
    </SettingsSection>
</template>
