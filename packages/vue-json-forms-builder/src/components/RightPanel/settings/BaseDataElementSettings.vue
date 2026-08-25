<script setup lang="ts">
import SettingsSection from '@/components/shared/SettingsSection.vue';
import FieldText from '@/components/shared/fields/FieldText.vue';
import FieldTextarea from '@/components/shared/fields/FieldTextarea.vue';
import FieldCheck from '@/components/shared/fields/FieldCheck.vue';
import { useElementSettings } from './useElementSettings';
import ElementNameField from './ElementNameField.vue';

const { stringField, optionalString, booleanField } = useElementSettings();

const title = stringField('title');
const description = optionalString('description');
const hidden = booleanField('hidden');
const tooltip = optionalString('tooltip');
const preHtml = optionalString('preHtml');
const postHtml = optionalString('postHtml');
</script>

<template>
    <!-- Basic: name (path segment) + title + description (inherited by every BaseDataElement) -->
    <SettingsSection title="Basic" icon="bi bi-sliders">
        <ElementNameField />
        <FieldText
            v-model="title"
            label="Title"
            placeholder="Element title"
            field-name="title"
        />
        <FieldTextarea
            v-model="description"
            label="Description"
            placeholder="Optional description"
            field-name="description"
        />
    </SettingsSection>

    <!-- Options: inherited by every BaseDataElement -->
    <SettingsSection title="Options" icon="bi bi-gear" :collapsible="true">
        <FieldCheck v-model="hidden" label="Hidden" field-name="hidden" />
        <FieldText v-model="tooltip" label="Tooltip" field-name="tooltip" />
        <FieldTextarea
            v-model="preHtml"
            label="Pre HTML"
            field-name="preHtml"
        />
        <FieldTextarea
            v-model="postHtml"
            label="Post HTML"
            field-name="postHtml"
        />
    </SettingsSection>
</template>
