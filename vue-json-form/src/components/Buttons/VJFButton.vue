<script setup lang="ts">
import type { Button } from '@/typings/ui-schema';
import { getComponent } from '@/stores/formStructureHelpers';

defineProps<{
    /**
     * The UI Schema of this Element
     */
    layoutElement: Button;
}>();

const buttonComponent = getComponent('Button');
</script>

<template>
    <component :is="buttonComponent" :layoutElement="layoutElement" />
</template>

<style scoped></style>
