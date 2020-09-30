<template>
  <FormField :json="schemaObject" :ui="ui"/>
</template>

<script>
import layout from "./layoutMixin";
import pointer from "json-pointer"
import FormField from "@/components/FormFields/FormField";

export default {
  name: "Control",
  components: {FormField},
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
