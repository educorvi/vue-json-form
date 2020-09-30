<template>
  <b-form>
    <FormWrap :json="json" :ui="ui"></FormWrap>
    <b-button :variant="colorVariant || 'primary'">Send</b-button>
  </b-form>
</template>

<script>
import FormWrap from "./FormWrap";
import {onlyProps} from "./Layouts/layoutMixin";

export default {
  name: "FormRoot",
  components: {FormWrap},
  mixins: [onlyProps],
  props: {
    //Color Variant like defined in Bootstrap-Vue
    colorVariant: {
      type: String,
      required: false
    }
  }
}
</script>

<style scoped>

</style>