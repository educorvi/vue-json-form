<script setup lang="ts">
const props = defineProps<{
    visible: boolean;
}>();
</script>

<template>
    <div class="vjf_showOnWrapper w-100">
        <slot v-if="visible" />
    </div>
</template>

<style scoped></style>
