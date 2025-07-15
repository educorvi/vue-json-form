<script setup lang="ts">
import type { Button } from '@educorvi/vue-json-forn-schemas';
import { BButton, BSpinner } from 'bootstrap-vue-next';
import { computedCssClass } from '@/computedProperties/css';
import { getOption } from '@/utilities';
import { computed } from 'vue';

const props = defineProps<{
    /**
     * The UI Schema of this Element
     */
    layoutElement: Button;

    /**
     * Show spinner
     */
    waiting?: boolean;
}>();
const cssClass = computedCssClass(props.layoutElement);
</script>

<template>
    <b-button
        :variant="layoutElement.options?.variant"
        :type="layoutElement.buttonType"
        :class="cssClass"
    >
        <span v-if="!waiting">
            {{ layoutElement.text }}
        </span>
        <span v-else> <b-spinner small /></span>
    </b-button>
</template>

<style scoped></style>
