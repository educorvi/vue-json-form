<script setup lang="ts">
import { BCollapse } from 'bootstrap-vue-next';
import type {
    ShowOnWrapperProps,
    ShowOnWrapperSlots,
} from '@/renderings/PropsAndEmitsForRenderings.ts';

defineProps<ShowOnWrapperProps>();
defineSlots<ShowOnWrapperSlots>();
</script>

<template>
    <BCollapse class="vjf_showOnWrapper" :visible="visible">
        <slot />
    </BCollapse>
</template>

<style scoped></style>
