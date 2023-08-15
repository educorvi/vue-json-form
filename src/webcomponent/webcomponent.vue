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
      const fdata = flatten(data)

      const {formMethod, formAction, formEnctype} = evt.submitter;

      this.submitShadowForm(formAction, fdata, formMethod, formEnctype)

    },
    /**
     * sends a request to the specified url from a form
     * @param {string} path the path to send the request to
     * @param {object} params the data
     * @param {string} [method=post] the method to use
     * @param {string} [encoding=application/x-www-form-urlencoded] the encoding to use
     */

    submitShadowForm(path, params, method = 'post', encoding = 'application/x-www-form-urlencoded') {
      const form = document.createElement('form');
      form.method = method;
      form.action = path;
      form.encoding = encoding;

      for (const key in params) {
        const hiddenField = document.createElement('input');
        hiddenField.type = 'hidden';
        hiddenField.name = key;
        hiddenField.value = params[key];

        form.appendChild(hiddenField);
      }

      document.body.appendChild(form);
      form.submit();
    }
  }
}
</script>

<style scoped>

</style>
