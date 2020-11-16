<template>
  <FormField @changedData="loopUp" :json="json" :ui="ui" :name="ui.scope"/>
</template>

<script>
import layout from "./layoutMixin.js";
import FormField from "../FormFields/FormField.vue";

//@group Layouts
export default {
  name: "Control",
  components: {FormField},
  mixins: [layout],
}
</script>

<style scoped>

</style>
