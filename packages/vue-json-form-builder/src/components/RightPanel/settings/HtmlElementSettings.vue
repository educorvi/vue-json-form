<script setup lang="ts">
import SettingsSection from '@/components/shared/SettingsSection.vue';
import FieldTextarea from '@/components/shared/fields/FieldTextarea.vue';
import { useElementSettings } from './useElementSettings';

const { stringField } = useElementSettings();

const htmlData = stringField('htmlData');
</script>

<template>
    <SettingsSection title="HTML" icon="bi bi-code">
        <FieldTextarea
            v-model="htmlData"
            label="HTML content"
            :rows="6"
            class="font-monospace"
            field-name="htmlData"
        />
    </SettingsSection>
</template>
