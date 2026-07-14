<!--
    BasePageContainer – Provides consistent horizontal padding and max-width
    for page content.

    Props:
    - fullHeight: Removes padding and max-width so child content fills the
      full available space. Useful for full-page editors/builders.
-->
<script setup lang="ts">
defineProps<{
    fullHeight?: boolean;
}>();
</script>

<template>
    <div
        v-if="fullHeight"
        class="d-flex flex-column flex-grow-1"
        style="min-height: 0"
    >
        <slot />
    </div>
    <div v-else class="py-4 px-4">
        <div class="mx-auto" style="max-width: 80rem">
            <slot />
        </div>
    </div>
</template>
