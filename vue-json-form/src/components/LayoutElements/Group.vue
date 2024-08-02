<script setup lang="ts">
import type { Layout } from '@/typings/ui-schema';
import VerticalLayout from '@/components/LayoutElements/VerticalLayout.vue';
import { computedCssClass } from '@/computedProperties/css';

const props = defineProps<{
    /**
     * The UI Schema of this Element
     */
    layoutElement: Layout;
}>();

const cssClass = computedCssClass(props.layoutElement, 'vjf_group');
</script>

<template>
    <fieldset :class="cssClass">
        <legend>{{ layoutElement.options?.label }}</legend>
        <vertical-layout
            class="vjf_fieldset-content"
            :layout-element="{ ...layoutElement, type: 'VerticalLayout' }"
        />
    </fieldset>
</template>

<style scoped></style>
