<script setup lang="ts">
import type { ModalProps } from '@/renderings/PropsAndEmitsForRenderings.ts';

const props = defineProps<ModalProps>();
</script>

<template>
    {{ props.layoutElement.modal.content }}
</template>

<style scoped></style>
