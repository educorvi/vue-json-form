<script setup lang="ts">
import { computedLabel, injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { computed, inject, onMounted, ref, toRefs } from 'vue';
import { generateUISchema } from '@/Commons';
import FormWrap from '@/components/FormWrap.vue';
import type { Layout, UISchema } from '@educorvi/vue-json-form-schemas';
import { watchThrottled } from '@vueuse/core';

const { jsonElement, layoutElement, savePath } = injectJsonData();
const id = controlID(savePath);

const layout = ref(undefined as Layout | undefined);

watchThrottled(
    [
        () => jsonElement.value.description,
        () => jsonElement.value.properties,
        () => layoutElement.value.scope,
        () => layoutElement.value.options?.label,
    ],
    () => {
        const generationOptions = {
            scopeBase: layoutElement.value.scope,
            layoutType: 'Group' as const,
            groupLabel:
                layoutElement.value.options?.label !== false
                    ? computedLabel(layoutElement).value
                    : '',
            groupDescription: jsonElement.value.description,
        };
        const uiSchema = generateUISchema(jsonElement.value, generationOptions);
        if (!layout.value) {
            layout.value = uiSchema.layout;
        } else {
            if (
                JSON.stringify(layout.value) !== JSON.stringify(uiSchema.layout)
            ) {
                layout.value = uiSchema.layout;
            }
        }
    },
    { deep: true, throttle: 100 }
);
</script>

<template>
    <FormWrap
        class="vjf_object"
        :id="id"
        v-if="layout"
        :key="layoutElement.scope"
        :layout-element="layout"
    />
</template>

<style scoped></style>
