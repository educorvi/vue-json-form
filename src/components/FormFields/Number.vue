<template>
  <b-form-input type="number" :name="title" :step="isInteger ? 1 : (item.multipleOf || Math.pow(10, -10))" :required="required"></b-form-input>
</template>

<script>
import formFieldMixin from "./formFieldMixin";

export default {
  name: "Number",
  mixins: [formFieldMixin],
  props: {
    isInteger: {
      type: Boolean
    }
  }
}
</script>

<style scoped>

</style>