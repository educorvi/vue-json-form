<script setup lang="ts">
import type { Buttongroup } from '@/typings/ui-schema';
import { getComponent } from '@/stores/formStructure';

defineProps<{
    /**
     * The UI Schema of this Element
     */
    layoutElement: Buttongroup;
}>();

const buttongroupComponent = getComponent('Buttongroup');
</script>

<template>
    <component :is="buttongroupComponent" :layoutElement="layoutElement" />
</template>

<style scoped></style>
