<template>
  <b-form-tags :id="schemaName" v-model="fieldData" ref="child" :required="required"
               :placeholder="ui.options ? ui.options.placeholder : ''" :tag-pills="ui.options.tags.pills"
               :tag-variant="ui.options.tags.variant" remove-on-delete></b-form-tags>
</template>

<script>
import formFieldMixin from "./formFieldMixin.js"

/**
 * Renders a tag input
 */


//@group FormFields
export default {
  name: "Tags",
  mixins: [formFieldMixin]
}
</script>

<style scoped>

</style>
