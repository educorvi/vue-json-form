<template>
  <b-form-select :id="schemaName" ref="child" v-model="fieldData" :name="title" :options="options" class="vjf_select"/>
</template>

<script>
import formFieldMixin from "./formFieldMixin.js";

//@group FormFields
/**
 * This is used to render select dropdown (Selection of enum)
 */
export default {
  name: "Select",
  mixins: [formFieldMixin],
  computed: {
    options() {
      function getTextForItem(options, key) {
        if (options?.enumTitles) {
          return options.enumTitles[key] || key;
        }
        return key;
      }

      return this.item.enum.map(key => {
        return {value: key, text: getTextForItem(this.ui.options, key)}
      })
    }
  },
}
</script>

<style scoped>

</style>
