<script setup lang="ts">
const props = defineProps<{
    header?: string;
}>();
</script>

<template>
    <div class="vjw_errorViewer">
        <h3>{{ props.header }}</h3>
        <slot />
    </div>
</template>

<style scoped>
.vjw_errorViewer {
    background: red;
}
</style>
