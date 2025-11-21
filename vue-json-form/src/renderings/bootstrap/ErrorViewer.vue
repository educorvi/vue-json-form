<script setup lang="ts">
import { BCard } from 'bootstrap-vue-next';
import type {
    ErrorViewerProps,
    ErrorViewerSlots,
} from '@/renderings/PropsAndEmitsForRenderings.ts';

const props = defineProps<ErrorViewerProps>();
defineSlots<ErrorViewerSlots>();
</script>

<template>
    <b-card
        class="vjw_errorViewer"
        header-bg-variant="danger"
        header-text-variant="white"
        :header="props.header"
        header-border-variant="danger"
        border-variant="danger"
    >
        <slot />
    </b-card>
</template>

<style scoped></style>
