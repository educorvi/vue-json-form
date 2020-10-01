<template>
  <b-checkbox :required="required" :name="title"><span v-if="ui.label || ui.label === undefined">{{ title }}</span></b-checkbox>
</template>

<script>
import formFieldMixin from "./formFieldMixin";

export default {
  name: "Boolean",
  mixins: [formFieldMixin],
}
</script>

<style scoped>

</style>
