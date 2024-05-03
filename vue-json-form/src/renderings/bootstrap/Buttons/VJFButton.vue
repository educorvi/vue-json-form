<script setup lang="ts">
import type { Button } from '@/typings/ui-schema';
import { BButton } from 'bootstrap-vue-next';
import { computedCssClass } from '@/computedProperties/css';

const props = defineProps<{
    /**
     * The UI Schema of this Element
     */
    layoutElement: Button;
}>();
const cssClass = computedCssClass(props.layoutElement);
</script>

<template>
    <b-button
        :variant="layoutElement.options?.variant"
        :type="layoutElement.buttonType"
        :class="cssClass"
        :formaction="layoutElement.options?.formaction"
        :formmethod="layoutElement.options?.formmethod"
        :formtarget="layoutElement.options?.formtarget"
        :formenctype="layoutElement.options?.formenctype"
        >{{ layoutElement.text }}</b-button
    >
</template>

<style scoped></style>
