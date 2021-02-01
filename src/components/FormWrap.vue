<template>
  <div class="container-fluid">
    <b-collapse :visible="show" @hidden="closed=true" @show="closed=false">
      <component :is="type" v-if="show || !closed" :filledData="filledData" :json="json" :ui="ui" :formID="formID"
                 @changedData="loopUp"></component>
    </b-collapse>
  </div>
</template>

<script>
import {onlyMethods, onlyProps} from "./Layouts/layoutMixin.js";

//@group Helper
/**
 * Decides, whether Control or Layout needs to be displayed
 */
export default {
  name: "form-wrap",
  mixins: [onlyProps, onlyMethods],
  data() {
    return {
      closed: true
    }
  },
  computed: {
    type() {
      return this.getComponentFromObject(this.ui);
    },
    show() {
      function getFunction(string) {
        switch (string) {
          case "EQUALS":
            return (a, b) => {
              if (a === undefined) a = false;
              return a === b
            };
          case "NOT_EQUALS":
            return (a, b) => {
              if (a === undefined) a = false;
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
            return (a, b) => (a || "").length > b;
        }
      }

      if (!this.ui["showOn"] || !this.filledData) {
        return true;
      }
      return getFunction(this.ui["showOn"].type)(this.filledData[this.ui["showOn"].scope], this.ui["showOn"]["referenceValue"]);
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
          return () => import("./Layouts/Control.vue");
        case "Group":
          return () => import("./Layouts/Group.vue");
        case "HorizontalLayout":
          return  () => import("./Layouts/HorizontalLayout.vue");
        case "HTML":
          return  () => import("./Layouts/htmlRenderer.vue");
        case "Divider":
          return  () => import("./Layouts/Divider.vue");
        case "Wizard":
          return  () => import("./Layouts/Wizard.vue");
        case "Button":
          return  () => import("./Layouts/Button.vue");
        default:
          return  () => import("./Layouts/VerticalLayout.vue");
      }
    },
  }
};
</script>

<style scoped>

</style>
