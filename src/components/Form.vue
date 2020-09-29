<template>
  <div class="container-fluid">
    <div v-if="typeof ui === 'object'">
      <component :is="type" :ui="ui" :json="json"></component>
    </div>
  </div>
</template>

<script>
import Layouts from "./Layouts"

export default {
  name: "Form",
  props: {
    //The form's UI-Schema
    ui: {
      type: [Object, Array],
      required: true
    },
    //The form's JSON-Schema
    json: {
      type: Object,
      required: true
    }
  },
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
    }
  },
}
</script>

<style scoped>

</style>
