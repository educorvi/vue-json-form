<script setup lang="ts">
import { computedLabel, injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { computed, inject, toRefs } from 'vue';
import { generateUISchema } from '@/Commons';
import FormWrap from '@/components/FormWrap.vue';

const { jsonElement, layoutElement, savePath } = injectJsonData();
const id = controlID(savePath);
const computedLayout = computed(() => {
    return generateUISchema(jsonElement.value, {
        scopeBase: layoutElement.value.scope,
        layoutType: 'Group',
        groupLabel:
            layoutElement.value.options?.label !== false
                ? computedLabel(layoutElement).value
                : '',
        groupDescription: jsonElement.value.description,
    });
});
</script>

<template>
    <FormWrap
        class="vjf_object"
        :id="id"
        :layout-element="computedLayout.layout"
    />
</template>

<style scoped></style>
