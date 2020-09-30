<template>
  <p>Number<span v-if="isInteger"> (Integer)</span></p>
</template>

<script>
import {onlyProps} from "../Layouts/layoutMixin";

export default {
  name: "Number",
  mixins: [onlyProps],
  props: {
    isInteger: {
      type: Boolean
    }
  }
}
</script>

<style scoped>

</style>