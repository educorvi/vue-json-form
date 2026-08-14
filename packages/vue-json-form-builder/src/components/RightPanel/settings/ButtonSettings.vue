<script setup lang="ts">
import SettingsSection from '@/components/shared/SettingsSection.vue';
import FieldText from '@/components/shared/fields/FieldText.vue';
import FieldCheck from '@/components/shared/fields/FieldCheck.vue';
import FieldSelect from '@/components/shared/fields/FieldSelect.vue';
import {
    ButtonVariantFormatEnum,
    type ButtonVariantFormat,
} from '@educorvi/vue-json-form-builder-schemas';
import { useElementSettings } from './useElementSettings';

const { stringField, booleanField, enumField } = useElementSettings();

const label = stringField('label');
const disabled = booleanField('disabled');
const variant = enumField<ButtonVariantFormat>('variant', 'primary');
const variantOptions = ButtonVariantFormatEnum.options;
</script>

<template>
    <!-- Button: inherited by SubmitButton + ResetButton -->
    <SettingsSection title="Button" icon="bi bi-send" :collapsible="true">
        <FieldText v-model="label" label="Label" field-name="label" />
        <FieldCheck v-model="disabled" label="Disabled" field-name="disabled" />
        <FieldSelect
            v-model="variant"
            label="Variant"
            :options="variantOptions"
            field-name="variant"
        />
    </SettingsSection>
</template>
