<template>
  <span v-html="ui['htmlData']"></span>
</template>

<script>
import {onlyProps} from "@/components/Layouts/layoutMixin";

export default {
  name: "htmlRenderer",
  mixins: [onlyProps]
}
</script>

<style scoped>

</style>
