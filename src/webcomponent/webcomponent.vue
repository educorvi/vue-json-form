<template>
  <json-form :json="parsedJSON" :ui="parsedUI" :on-submit="onSubmit" :disableValidation="disable_validation">
    <slot/>
  </json-form>
</template>

<script>
import jsonForm from "@/components/FormRoot"
const flatten = require('flat')

export default {
  name: "vue_json_form",
  components: {jsonForm},
  props: {
    json: {
      required: true
    },
    ui: {
      required: false
    },
    disable_validation: {
      required: false,
      default: false
    }
  },
  computed: {
    parsedJSON() {
      return JSON.parse(this.json);
    },
    parsedUI() {
      if (this.ui) {
        return JSON.parse(this.ui);
      } else return undefined;
    }
  },
  methods: {
    onSubmit(data, evt) {
      console.log(flatten(data), evt)
    },
  }
}
</script>

<style scoped>

</style>
