<template>
<b-form>
  <FormWrap :json="json" :ui="ui"></FormWrap>
</b-form>
</template>

<script>
import FormWrap from "./FormWrap";
import {onlyProps} from "./Layouts/layoutMixin";
export default {
name: "FormRoot",
  components: {FormWrap},
  mixins: [onlyProps]
}
</script>

<style scoped>

</style>