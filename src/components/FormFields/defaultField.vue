<template>
  <p>No Item found for type "{{item.type}}"</p>
</template>

<script>
import formFieldMixin from "./formFieldMixin";

export default {
  name: "defaultField",
  mixins: [formFieldMixin]
}
</script>

<style scoped>

</style>