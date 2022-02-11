<template>
  <json-form :json="parsedJSON" :ui="parsedUI" :on-submit="onSubmit" :disableValidation="disable_validation">
    <slot/>
  </json-form>
</template>

<script>
import jsonForm from "@/components/FormRoot"
import axios from "axios"
import qs from "qs"

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
    },
    post_url: {
      required: true
    },
    use_x_www_form_urlencoded: {
      type: String,
      required: false,
      default: "false"
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
    onSubmit(data) {
      if (this.use_x_www_form_urlencoded === "true") {
        data = qs.stringify(data);
      }
      axios.post(this.post_url, data).catch(console.error);

    },
  }
}
</script>

<style scoped>

</style>
