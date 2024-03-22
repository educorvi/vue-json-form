<script setup lang="ts">
import { computedLabel, injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { computed } from 'vue';
import { generateUISchema } from '@/Commons';
import FormWrap from '@/components/FormWrap.vue';

const { layoutElement, jsonElement } = injectJsonData();
const id = controlID(layoutElement);
const computedLayout = computed(() => {
    return generateUISchema(jsonElement, {
        scopeBase: layoutElement.scope,
        layoutType: 'Group',
        groupLabel: computedLabel(layoutElement).value,
    });
});
</script>

<template>
    <FormWrap class="vjf_object" :id="id" :layout-element="computedLayout.layout" />
</template>

<style scoped></style>
