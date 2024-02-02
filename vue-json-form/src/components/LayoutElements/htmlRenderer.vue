<script setup lang="ts">
import type {HTMLRenderer} from "@/typings/ui-schema";

const props = defineProps<{
  /**
   * The UI Schema of this Element
   */
  layoutElement: HTMLRenderer;
}>()
</script>

<template>
<span v-html="layoutElement.htmlData" class="vjf_htmlRenderer"></span>
</template>

<style scoped>

</style>