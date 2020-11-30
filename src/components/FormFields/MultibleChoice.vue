<template>
  <b-form-checkbox-group
      ref="child"
      v-model="fieldData"
      :name="title"
      :options="options"
      :stacked="this.ui.options.stacked"
  />
</template>

<script>
import formFieldMixin from "./formFieldMixin.js";

//@group FormFields
/**
 * This is used to render MultibleChoice entries with a checkbox-group
 */
export default {
  name: "MultibleChoice",
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
