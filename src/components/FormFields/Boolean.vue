<template>
  <b-checkbox :required="required" :name="title">{{ title }}</b-checkbox>
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