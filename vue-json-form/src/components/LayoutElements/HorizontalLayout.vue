<script setup lang="ts">
import type { Layout } from '@/typings/ui-schema'
import {
    computedCssClass,
    computedElementsWithUUID,
} from '@/components/LayoutElements/LayoutCommons'
import FormWrap from '@/components/FormWrap.vue'

const props = defineProps<{
    /**
     * The UI Schema of this Element
     */
    layoutElement: Layout
}>()

const cssClass = computedCssClass(props.layoutElement, 'vjf_horizontalLayout')
const elementsWithUUID = computedElementsWithUUID(props.layoutElement)
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
    align-items: center;
    justify-content: space-around;
}
</style>
