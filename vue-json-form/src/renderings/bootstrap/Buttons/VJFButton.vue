<script setup lang="ts">
import type { Button } from '@/typings/ui-schema';
import { BButton } from 'bootstrap-vue-next';

defineProps<{
    /**
     * The UI Schema of this Element
     */
    layoutElement: Button;
}>();
</script>

<template>
    <b-button :variant="layoutElement.options?.variant" :type="layoutElement.buttonType">{{
        layoutElement.text
    }}</b-button>
</template>

<style scoped></style>
