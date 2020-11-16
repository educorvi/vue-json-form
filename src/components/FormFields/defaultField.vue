<template>
  <p>No Item found for type "{{ item.type }}"</p>
</template>

<script>
import formFieldMixin from "./formFieldMixin.js";

//@group FormFields
/**
 * This is the fallback-field if no matching field is found
 */
export default {
  name: "defaultField",
  mixins: [formFieldMixin]
}
</script>

<style scoped>

</style>
