<template>
  <p>{{schemaObject}}</p>
</template>

<script>
import layout from "./layoutMixin";
import pointer from "json-pointer"

export default {
  name: "Control",
  mixins: [layout],
  computed: {
    schemaObject() {
      return pointer.get(this.json, this.ui.scope.substring(1, this.ui.scope.length));
    }
  },
}
</script>

<style scoped>

</style>
