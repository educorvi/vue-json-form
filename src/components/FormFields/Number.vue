<template>
  <b-form-input ref="child" v-if="!ui.options || !ui.options.rating" v-model="fieldData" :name="title" :placeholder="ui.options ? ui.options.placeholder : ''"
                :required="required" :step="isInteger ? 1 : (item.multipleOf || Math.pow(10, -10))"
                type="number"></b-form-input>
  <b-form-rating ref="child" v-else v-model="fieldData" :name="title" :required="required" :stars="item.maximum || 5"
                 variant="warning"></b-form-rating>
</template>

<script>
import formFieldMixin from "./formFieldMixin.js";

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
