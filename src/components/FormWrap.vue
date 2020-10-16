<template>
  <div class="container-fluid">
    <component @changedData="loopUp" :is="type" :ui="ui" :json="json"></component>
  </div>
</template>

<script>
import Layouts from "./Layouts"
import {onlyMethods, onlyProps} from "./Layouts/layoutMixin.js";

export default {
  name: "form-wrap",
  mixins: [onlyProps, onlyMethods],
  computed: {
    type() {
      return this.getComponentFromObject(this.ui);
    }
  },
  methods: {
    /**
     * Returns the Layout which is set in the ui-schema for the object obj
     * @param obj the ui-schema
     */
    getComponentFromObject(obj) {
      switch (obj.type) {
        case "Control":
          return Layouts.Control;
        case "Group":
          return Layouts.Group;
        case "HorizontalLayout":
          return Layouts.HorizontalLayout;
        default:
          return Layouts.VerticalLayout;
      }
    },
  },
};
</script>

<style scoped>

</style>
