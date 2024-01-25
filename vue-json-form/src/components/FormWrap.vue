<template>
<component></component>
</template>

<script setup lang="ts">
import type {Layoutelement, UISchema} from "@/typings/ui-schema";
import {computed, defineProps} from "vue";
import type {Component} from "vue";
import Layouts from "@/components/Layouts";
import Buttons from "@/components/Buttons";
import UnknownComponent from "@/components/UnknownComponent.vue";


const props = defineProps<{
  /**
   * The UI Schema of the form
   */
  uiSchema: UISchema | Layoutelement;
}>()

const component = computed<Component>(() => {
  switch (props.uiSchema.type) {
    case 'Control':
      return Layouts.Control;
    case 'VerticalLayout':
      return Layouts.VerticalLayout;
    case 'HorizontalLayout':
      return Layouts.HorizontalLayout;
    case 'Group':
      return Layouts.Group;
    case 'HTML':
      return Layouts.htmlRenderer;
    case 'Divider':
      return Layouts.Divider;
    case 'Wizard':
      return Layouts.Wizard;
    case 'Button':
      return Buttons.vjfButton;
    case 'Buttongroup':
      return Buttons.vjfButtonGroup;
  }

  return UnknownComponent
});
</script>

<style scoped>

</style>