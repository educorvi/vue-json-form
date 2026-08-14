<script setup lang="ts">
import { computed } from 'vue';
import { useElementSettings } from './useElementSettings';
import { uiFor } from '@/elements';

const { element } = useElementSettings();

const entry = computed(() => (element.value ? uiFor(element.value) : null));
</script>

<template>
    <component
        :is="entry?.settingsComponent"
        v-if="entry?.settingsComponent"
        :key="element?.uid"
    />
</template>
