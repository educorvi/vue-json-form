<script setup lang="ts">
import { computedLabel, injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { computed } from 'vue';
import { generateUISchema } from '@/Commons';
import FormWrap from '@/components/FormWrap.vue';

const { layoutElement, jsonElement, savePath } = injectJsonData();
const id = controlID(savePath);
const computedLayout = computed(() => {
    return generateUISchema(jsonElement, {
        scopeBase: layoutElement.scope,
        layoutType: 'Group',
        groupLabel:
            layoutElement.options?.label !== false
                ? computedLabel(layoutElement).value
                : '',
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
