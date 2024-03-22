<script setup lang="ts">
import type { Layout } from '@/typings/ui-schema';
import { computedElementsWithUUID } from '@/components/LayoutElements/LayoutCommons';
import FormWrap from '@/components/FormWrap.vue';
import { computedCssClass } from '@/computedProperties/css';

const props = defineProps<{
    /**
     * The UI Schema of this Element
     */
    layoutElement: Layout;
}>();

const cssClass = computedCssClass(props.layoutElement, 'vjf_horizontalLayout');
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

<style>
.vjf_horizontalLayout {
    display: flex;
    flex-direction: row;
    align-items: start;
    justify-content: space-around;
}
.vjf_horizontalLayout > * {
    flex: 2 1 auto;
    margin-left: 10px;
    margin-right: 10px;
}
.vjf_horizontalLayout > *:first-child {
    margin-left: 0;
}
.vjf_horizontalLayout > *:last-child {
    margin-right: 0;
}
</style>
