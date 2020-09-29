<template>
  <div class="container-fluid">
<!--    <div v-if="!Array.isArray(ui)">-->
    <component :is="type" :ui="ui" :json="json"></component>
<!--    </div>-->
<!--    <div v-else>-->
<!--      <component v-for="(item, index) in ui" :is="getComponentFromArrayitem(index)" :ui="item" :json="json" :key="item.type+index"/>-->
<!--    </div>-->
  </div>
</template>

<script>
import Layouts from "./Layouts"
import {onlyProps} from "@/components/Layouts/layout";

export default {
  name: "form-wrap",
  mixins: [onlyProps],
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
    // /**
    //  * Returns the Layout which is set in the ui-schema for the item in ui at index i
    //  * @param i index of the item
    //  */
    // getComponentFromArrayitem(i) {
    //   return this.getComponentFromObject(this.ui[i]);
    // }
  },
};
</script>

<style scoped>

</style>
