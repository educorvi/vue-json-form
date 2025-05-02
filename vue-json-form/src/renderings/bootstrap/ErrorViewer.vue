<script setup lang="ts">
import { BCard } from 'bootstrap-vue-next';

const props = defineProps<{
    header?: string;
}>();
</script>

<template>
    <b-card
        class="vjw_errorViewer text-center"
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
