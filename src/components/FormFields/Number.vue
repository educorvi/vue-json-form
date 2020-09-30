<template>
  <p>Number<span v-if="isInteger"> (Integer)</span></p>
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