<script setup lang="ts">
import type {Layout} from "@/typings/ui-schema";
import FormWrap from "@/components/FormWrap.vue";
import {computedCssClass} from "@/components/LayoutElements/LayoutCommons";

const props = defineProps<{
  /**
   * The UI Schema of this Element
   */
  layoutElement: Layout;
}>()

const cssClass = computedCssClass(props.layoutElement, "vjf_verticalLayout");
</script>

<template>
  <div :class="cssClass">
    <form-wrap v-for="element in layoutElement.elements" :layout-element="element"/>
  </div>

</template>

<style scoped>

</style>