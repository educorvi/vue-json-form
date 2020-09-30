<template>
  <p>No Item found for type "{{json.type}}"</p>
</template>

<script>
import {onlyProps} from "../Layouts/layoutMixin";

export default {
  name: "defaultField",
  mixins: [onlyProps]
}
</script>

<style scoped>

</style>