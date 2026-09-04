<script setup lang="ts">
import SettingsSection from '@/components/shared/SettingsSection.vue';
import FieldText from '@/components/shared/fields/FieldText.vue';
import FieldTextarea from '@/components/shared/fields/FieldTextarea.vue';
import FieldSelect from '@/components/shared/fields/FieldSelect.vue';
import {
    ButtonVariantFormatEnum,
    ModalSize,
    type ButtonVariantFormat,
} from '@educorvi/vue-json-forms-builder-schemas';
import { useElementSettings } from './useElementSettings';
import ElementNameField from './ElementNameField.vue';

const { stringField, enumField } = useElementSettings();

const buttonLabel = stringField('buttonLabel');
const title = stringField('title');
const content = stringField('content');
const size = enumField('size', ModalSize.large);
const sizeOptions = Object.values(ModalSize);
const buttonVariant = enumField<ButtonVariantFormat>(
    'buttonVariant',
    'primary'
);
const buttonVariantOptions = ButtonVariantFormatEnum.options;
</script>

<template>
    <SettingsSection title="Basic" icon="bi bi-window">
        <ElementNameField />
    </SettingsSection>
    <SettingsSection title="Modal" icon="bi bi-window">
        <FieldText
            v-model="buttonLabel"
            label="Button label"
            field-name="buttonLabel"
        />
        <FieldText v-model="title" label="Modal title" field-name="title" />
        <FieldTextarea
            v-model="content"
            label="Content (HTML supported)"
            :rows="4"
            field-name="content"
        />
        <div class="row g-2">
            <div class="col">
                <FieldSelect
                    v-model="size"
                    label="Size"
                    :options="sizeOptions"
                    field-name="size"
                />
            </div>
            <div class="col">
                <FieldSelect
                    v-model="buttonVariant"
                    label="Variant"
                    :options="buttonVariantOptions"
                    field-name="buttonVariant"
                />
            </div>
        </div>
    </SettingsSection>
</template>
