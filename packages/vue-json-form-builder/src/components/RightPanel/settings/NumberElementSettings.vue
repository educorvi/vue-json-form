<script setup lang="ts">
import SettingsSection from '@/components/shared/SettingsSection.vue';
import FieldNumber from '@/components/shared/fields/FieldNumber.vue';
import FieldSelect from '@/components/shared/fields/FieldSelect.vue';
import { NumberFormat } from '@educorvi/vue-json-form-builder-schemas';
import { useElementSettings } from './useElementSettings';
import SimpleElementSettings from './SimpleElementSettings.vue';

const { enumField, optionalNumber } = useElementSettings();

const format = enumField('format', NumberFormat.Number);
const formatOptions = Object.values(NumberFormat);
const minimum = optionalNumber('minimum');
const maximum = optionalNumber('maximum');
const multipleOf = optionalNumber('multipleOf');
</script>

<template>
    <!-- inherited options (SimpleElement → BaseDataElement) -->
    <SimpleElementSettings />

    <!-- Number-specific -->
    <SettingsSection title="Number" icon="bi bi-123" :collapsible="true">
        <FieldSelect
            v-model="format"
            label="Format"
            :options="formatOptions"
            field-name="format"
        />
        <div class="row g-2">
            <div class="col">
                <FieldNumber
                    v-model="minimum"
                    label="Minimum"
                    field-name="minimum"
                />
            </div>
            <div class="col">
                <FieldNumber
                    v-model="maximum"
                    label="Maximum"
                    field-name="maximum"
                />
            </div>
        </div>
        <FieldNumber
            v-model="multipleOf"
            label="Multiple of"
            field-name="multipleOf"
        />
    </SettingsSection>
</template>
