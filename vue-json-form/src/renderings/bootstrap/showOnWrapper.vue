<script setup lang="ts">
import { BCollapse } from 'bootstrap-vue-next';

const props = defineProps<{
    visible: boolean;
}>();
</script>

<template>
    <BCollapse class="vjf_showOnWrapper" :visible="visible">
        <slot />
    </BCollapse>
</template>

<style scoped></style>
