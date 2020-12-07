<template>
  <span v-html="ui['htmlData']"></span>
</template>

<script>
import {onlyProps} from "./layoutMixin";

/**Renders html specified in the ui schema
 * @group Layouts
 */
export default {
  name: "htmlRenderer",
  mixins: [onlyProps]
}
</script>

<style scoped>

</style>
