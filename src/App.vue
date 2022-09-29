<template>
  <div id="app" class="container-fluid pt-5 pb-5" style="max-width: 800px">
    <h5>Vue JSON Form Demo</h5>
    <b-select :options="dropOptions" v-model="form"></b-select>
    <hr>
    <form-root :key="JSON.stringify(form)" :json="form.schema" :filledData="form.filledData" :on-submit="submit" :ui="form.ui">
    </form-root>
    <b-collapse :visible="!!formData" style="margin-top: 80px" @shown="shown()">
      <b-card title="Result" id="result_beautified">
        <vue-json-pretty v-if="!!formData" :data="formData"></vue-json-pretty>
      </b-card>
      <b-card class="mt-2" title="Result raw" v-show="false">
        <div id="result_raw">
          {{ JSON.stringify(formData)}}
        </div>
      </b-card>
    </b-collapse>
  </div>
</template>

<script>

import forms from "./exampleSchemas"
import FormRoot from "@/components/FormRoot";
import VueJsonPretty from "vue-json-pretty";
import 'vue-json-pretty/lib/styles.css';

export default {
  name: 'App',
  components: {
    FormRoot,
    VueJsonPretty
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
      form: forms["Showcase"],
      formData: null
    }
  },
  created() {

  },
  methods: {
    shown() {
      document.getElementById('result_beautified').scrollIntoView({behavior: "smooth"})
    },
    submit(data) {
      this.formData = data;
      this.shown();
      console.log(JSON.stringify(data));
    }
  }
}
</script>

<style>

</style>
