<template>
  <b-form-checkbox-group
      :id="schemaName"
      ref="child"
      v-model="fieldData"
      :name="title"
      :options="options"
      :stacked="this.ui.options && this.ui.options.stacked"
      :required="required"
      :buttons="!!(this.ui.options && this.ui.options.buttons)"
      :button-variant="variant"
      :switches="!(this.ui.options && this.ui.options.buttons) && switches"
      class="vjf_checkboxes"
  />
</template>

<script>
import formFieldMixin from "./formFieldMixin.js";

//@group FormFields
/**
 * This is used to render MultibleChoice entries with a checkbox-group
 */
export default {
  name: "Checkboxes",
  mixins: [formFieldMixin],
  computed: {
    options() {
      function getTextForItem(options, key) {
        if (options?.enumTitles) {
          return options.enumTitles[key] || key;
        }
        return key;
      }

      return (this.item.items || this.item).enum.map(key => {
        return {value: key, text: getTextForItem(this.ui.options, key)}
      })
    }
  },
}
</script>

<style scoped>

</style>
