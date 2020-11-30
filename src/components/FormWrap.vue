<template>
  <div v-if="show" class="container-fluid">
    <component :is="type" :filledData="filledData" :json="json" :ui="ui" @changedData="loopUp"></component>
  </div>
</template>

<script>
import Layouts from "./Layouts"
import {onlyMethods, onlyProps} from "./Layouts/layoutMixin.js";

//@group Helper
/**
 * Decides, whether Control or Layout needs to be displayed
 */
export default {
  name: "form-wrap",
  mixins: [onlyProps, onlyMethods],
  computed: {
    type() {
      return this.getComponentFromObject(this.ui);
    },
    show() {
      function getFunction(string) {
        switch (string) {
          case "EQUALS":
            return (a, b) => {
              if(a === undefined) a = false;
              return a === b
            };
          case "NOT_EQUALS":
            return (a, b) => {
              if(a === undefined) a = false;
              return a !== b
            };
          case "GREATER":
            return (a, b) => a > b;
          case "GREATER_OR_EQUAL":
            return (a, b) => a >= b;
          case "SMALLER":
            return (a, b) => a < b;
          case "SMALLER_OR_EQUAL":
            return (a, b) => a < b;
          case "LONGER":
            return (a, b) => (a||"").length > b;
        }
      }

      if (!this.ui["showOn"] || !this.filledData) {
        return true;
      }
      return getFunction(this.ui["showOn"].type)(this.filledData[this.ui["showOn"].scope],this.ui["showOn"]["referenceValue"]);
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
  }
};
</script>

<style scoped>

</style>
