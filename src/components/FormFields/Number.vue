<template>
  <b-form-input v-model="fieldData" v-if="!ui.options || !ui.options.rating" type="number" :name="title" :step="isInteger ? 1 : (item.multipleOf || Math.pow(10, -10))" :required="required" :placeholder="ui.options ? ui.options.placeholder : ''"></b-form-input>
  <b-form-rating v-model="fieldData" v-else variant="warning" :stars="item.maximum || 5" :required="required" :name="title"></b-form-rating>
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
