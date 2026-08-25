<script setup lang="ts">
import { computed } from 'vue';
import SettingsSection from '@/components/shared/SettingsSection.vue';
import {
    ButtonElement,
    ButtonGroupElement,
} from '@educorvi/vue-json-forms-builder-schemas';
import { useElementSettings } from './useElementSettings';
import ElementNameField from './ElementNameField.vue';

const { builder, element } = useElementSettings();

const buttons = computed(() => {
    const el = element.value;
    if (!(el instanceof ButtonGroupElement)) return [];
    const fd = builder.formDefinition.value;
    if (!fd) return [];
    return el.data.buttons
        .map((uid) => fd.getElementById(uid))
        .filter((b): b is ButtonElement => b instanceof ButtonElement);
});
</script>

<template>
    <SettingsSection title="Basic" icon="bi bi-justify">
        <ElementNameField />
    </SettingsSection>
    <SettingsSection title="Button Group" icon="bi bi-justify">
        <p class="small text-body-secondary">
            The group contains the following buttons:
        </p>
        <ul class="small mb-0">
            <li v-for="b in buttons" :key="b.uid">{{ b.label }}</li>
        </ul>
    </SettingsSection>
</template>
