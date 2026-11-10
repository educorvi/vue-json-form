<script setup lang="ts">
import type { Buttongroup } from '@educorvi/vue-json-form-schemas';
import { getStores } from '@/computedProperties/json.ts';

defineProps<{
    /**
     * The UI Schema of this Element
     */
    layoutElement: Buttongroup;
}>();

const buttongroupComponent =
    getStores().formStructureStore.getComponent('Buttongroup');
</script>

<template>
    <component :is="buttongroupComponent" :layout-element="layoutElement" />
</template>

<style scoped></style>
