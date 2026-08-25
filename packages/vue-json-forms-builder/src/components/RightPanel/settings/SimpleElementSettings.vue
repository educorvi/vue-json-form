<script setup lang="ts">
import SettingsSection from '@/components/shared/SettingsSection.vue';
import FieldText from '@/components/shared/fields/FieldText.vue';
import FieldCheck from '@/components/shared/fields/FieldCheck.vue';
import { useElementSettings } from './useElementSettings';
import BaseDataElementSettings from './BaseDataElementSettings.vue';

const { booleanField, optionalString } = useElementSettings();

const required = booleanField('required');
const appendValue = optionalString('appendValue');
const prependValue = optionalString('prependValue');
</script>

<template>
    <!-- inherited from SimpleElement's parent classes -->
    <BaseDataElementSettings />

    <!-- Validation: inherited by every SimpleElement -->
    <SettingsSection
        title="Validation"
        icon="bi bi-check2-square"
        :collapsible="true"
    >
        <FieldCheck v-model="required" label="Required" field-name="required" />
        <FieldText
            v-model="appendValue"
            label="Append value"
            field-name="appendValue"
        />
        <FieldText
            v-model="prependValue"
            label="Prepend value"
            field-name="prependValue"
        />
    </SettingsSection>
</template>
