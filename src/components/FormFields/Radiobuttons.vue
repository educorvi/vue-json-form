<template>
  <b-form-radio-group
      v-model="fieldData"
      :name="title"
      :options="options"></b-form-radio-group>
</template>

<script>
import formFieldMixin from "./formFieldMixin.js";

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
