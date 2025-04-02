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
        :formaction="layoutElement.options?.nativeSubmitOptions?.formaction"
        :formmethod="layoutElement.options?.nativeSubmitOptions?.formmethod"
        :formtarget="layoutElement.options?.nativeSubmitOptions?.formtarget"
        :formenctype="layoutElement.options?.nativeSubmitOptions?.formenctype"
        :formnovalidate="
            layoutElement.options?.formnovalidate ? 'formnovalidate' : undefined
        "
        >{{ layoutElement.text }}</b-button
    >
</template>

<style scoped></style>
