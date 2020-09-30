<template>
  <FormField :json="json" :ui="ui"/>
</template>

<script>
import layout from "./layoutMixin";
import FormField from "@/components/FormFields/FormField";

export default {
  name: "Control",
  components: {FormField},
  mixins: [layout],
}
</script>

<style scoped>

</style>
