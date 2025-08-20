<script setup lang="ts">
import type { Layout } from '@educorvi/vue-json-form-schemas';
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
        <legend v-show="layoutElement.options?.label">
            {{ layoutElement.options?.label || 'Unnamed group' }}
        </legend>
        <vertical-layout
            class="vjf_fieldset-content"
            :layout-element="{ ...layoutElement, type: 'VerticalLayout' }"
        />
    </fieldset>
</template>

<style scoped></style>
