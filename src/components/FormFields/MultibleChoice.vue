<template>
  <b-form-checkbox-group
      ref="child"
      v-model="fieldData"
      :name="title"
      :options="options"
  />
</template>

<script>
import formFieldMixin from "./formFieldMixin";

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

      return this.item.items.enum.map(key => {
        return {value: key, text: getTextForItem(this.ui.options, key)}
      })
    }
  },
}
</script>

<style scoped>

</style>
