<template>
  <b-form-radio-group
      v-model="fieldData"
      :name="title"
      :options="options"
      :stacked="this.ui.options.stacked"></b-form-radio-group>
</template>

<script>
import formFieldMixin from "./formFieldMixin.js";

//@group FormFields
/**
 * This is used to render Radiobutton Groups (Selection of enum)
 */
export default {
  name: "Radiobuttons",
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
  }
}
</script>

<style scoped>

</style>
