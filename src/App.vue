<template>
  <div id="app" class="container-fluid pt-5 pb-5" style="max-width: 800px">
    <h5>Vue JSON Form Demo</h5>
    <b-select :options="dropOptions" v-model="form"></b-select>
    <hr>
    <form-root :json="form.schema" :on-submit="submit" :ui="form.ui">
    </form-root>
  </div>
</template>

<script>

import forms from "./exampleSchemas"
import FormRoot from "@/components/FormRoot";

export default {
  name: 'App',
  components: {
    FormRoot
  },
  computed: {
    dropOptions() {
      return Object.keys(forms).map(form => {
        return {text: form, value: forms[form]}
      });
    },
    isWizardSelected() {
      return this.form === forms["5 Sicherheitsregeln (Wizard)"];
    }
  },
  data() {
    return {
      form: forms["5 Sicherheitsregeln (Wizard)"]
    }
  },
  created() {

  },
  methods: {
    submit(data) {
      console.log(JSON.stringify(data));
    }
  }
}
</script>

<style>

</style>
