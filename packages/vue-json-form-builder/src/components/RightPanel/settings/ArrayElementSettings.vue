<script setup lang="ts">
import SettingsSection from '@/components/shared/SettingsSection.vue';
import FieldText from '@/components/shared/fields/FieldText.vue';
import FieldNumber from '@/components/shared/fields/FieldNumber.vue';
import FieldCheck from '@/components/shared/fields/FieldCheck.vue';
import { useElementSettings } from './useElementSettings';
import ContainerElementSettings from './ContainerElementSettings.vue';

const { booleanField, optionalString, optionalNumber } = useElementSettings();

const required = booleanField('required');
const buttonLabel = optionalString('buttonLabel');
const minItems = optionalNumber('minItems');
const maxItems = optionalNumber('maxItems');
</script>

<template>
    <!-- inherited options (ContainerElement → BaseDataElement) + layout -->
    <ContainerElementSettings />

    <!-- Array-specific -->
    <SettingsSection title="Array" icon="bi bi-list-ul" :collapsible="true">
        <FieldCheck v-model="required" label="Required" field-name="required" />
        <FieldText
            v-model="buttonLabel"
            label="Add button label"
            placeholder="Add Item"
            field-name="buttonLabel"
        />
        <div class="row g-2">
            <div class="col">
                <FieldNumber
                    v-model="minItems"
                    label="Min items"
                    :min="0"
                    field-name="minItems"
                />
            </div>
            <div class="col">
                <FieldNumber
                    v-model="maxItems"
                    label="Max items"
                    :min="0"
                    field-name="maxItems"
                />
            </div>
        </div>
    </SettingsSection>
</template>
