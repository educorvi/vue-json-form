<template>
  <div class="container-fluid vjf_wrap">
    <b-collapse :visible="show" @hidden="closed=true" @show="closed=false">
      <component :is="type" v-if="show || !closed" :filledData="filledData" :json="json" :ui="ui" :formID="formID"
                 @changedData="loopUp"></component>
    </b-collapse>
  </div>
</template>

<script>
import {onlyMethods, onlyProps} from "./Layouts/layoutMixin.js";
import Layouts from "./Layouts"

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
          return Layouts.Control;
        case "Group":
          return Layouts.Group;
        case "HorizontalLayout":
          return Layouts.HorizontalLayout;
        case "HTML":
          return Layouts.htmlRenderer;
        case "Divider":
          return Layouts.Divider;
        case "Wizard":
          return Layouts.Wizard;
        case "Button":
          return Layouts.Button;
        default:
          return Layouts.VerticalLayout;
      }
    },
  }
};
</script>

<style scoped>

</style>
