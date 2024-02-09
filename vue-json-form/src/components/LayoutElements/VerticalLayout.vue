<script setup lang="ts">
import type { Layout } from '@/typings/ui-schema';
import FormWrap from '@/components/FormWrap.vue';
import { computedElementsWithUUID } from '@/components/LayoutElements/LayoutCommons';
import { computedCssClass } from '@/computedProperties/css';

const props = defineProps<{
    /**
     * The UI Schema of this Element
     */
    layoutElement: Layout;
}>();

const cssClass = computedCssClass(props.layoutElement, 'vjf_verticalLayout');
const elementsWithUUID = computedElementsWithUUID(props.layoutElement);
</script>

<template>
    <div :class="cssClass">
        <form-wrap
            v-for="element in elementsWithUUID"
            :layout-element="element"
            :key="element.uuid"
        />
    </div>
</template>

<style scoped></style>
