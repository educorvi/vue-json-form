<script setup lang="ts">
import SettingsSection from '@/components/shared/SettingsSection.vue';
import FieldText from '@/components/shared/fields/FieldText.vue';
import FieldTextarea from '@/components/shared/fields/FieldTextarea.vue';
import { useElementSettings } from './useElementSettings';
import LayoutSection from './LayoutSection.vue';

const { stringField, optionalString } = useElementSettings();

const title = stringField('title');
const description = optionalString('description');
</script>

<template>
    <!-- Basic: the root form's title/description -->
    <SettingsSection title="Basic" icon="bi bi-sliders">
        <FieldText
            v-model="title"
            label="Title"
            placeholder="Form title"
            field-name="title"
        />
        <FieldTextarea
            v-model="description"
            label="Description"
            placeholder="Optional description"
            field-name="description"
        />
    </SettingsSection>

    <!-- Layout: vertical/horizontal for the whole form -->
    <LayoutSection />
</template>
