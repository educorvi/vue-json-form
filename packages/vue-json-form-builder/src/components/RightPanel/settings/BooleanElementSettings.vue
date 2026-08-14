<script setup lang="ts">
import SimpleElementSettings from './SimpleElementSettings.vue';
</script>

<template>
    <!-- BooleanElement has no Boolean-specific options (format/mustBeTrue
         were dropped) — everything lives in SimpleElement → BaseDataElement. -->
    <SimpleElementSettings />
</template>
