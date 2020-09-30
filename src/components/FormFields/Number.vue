<template>
  <p>Number<span v-if="integer"> (Integer)</span></p>
</template>

<script>
import {onlyProps} from "../Layouts/layoutMixin";

export default {
  name: "Number",
  mixins: [onlyProps],
  props: {
    integer: {
      type: Boolean
    }
  }
}
</script>

<style scoped>

</style>