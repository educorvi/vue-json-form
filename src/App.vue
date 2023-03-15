<template>
  <div id="app" class="container-fluid pt-5 pb-5" style="max-width: 800px">
    <h5>Vue JSON Form Demo</h5>
    <b-select :options="dropOptions" v-model="form"></b-select>
    <b-input-group prepend="Upload custom json" class="mt-2">
      <b-form-file placeholder="Form Schema" v-model="customForm"></b-form-file>
      <b-form-file placeholder="UI Schema" v-model="customUI"></b-form-file>
    </b-input-group>
    <hr>
    <form-root :key="JSON.stringify(form)" :json="form.schema" :filledData="form.filledData" :on-submit="submit"
               :ui="form.ui">
    </form-root>
    <b-collapse :visible="!!formData" style="margin-top: 80px" @shown="shown()">
      <b-card title="Result" id="result_beautified">
        <vue-json-pretty v-if="!!formData" :data="formData"></vue-json-pretty>
      </b-card>
      <b-card class="mt-2" title="Result raw" v-show="false">
        <div id="result_raw">
          {{ JSON.stringify(formData) }}
        </div>
      </b-card>
    </b-collapse>
  </div>
</template>

<script>

import importedForms from "./exampleSchemas"
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
      return Object.keys(this.forms).map(form => {
        return {text: form, value: this.forms[form]}
      });
    },
    isWizardSelected() {
      return this.form === this.forms["5 Sicherheitsregeln (Wizard)"];
    }
  },
  data() {
    return {
      forms: importedForms,
      form: importedForms["Showcase"],
      formData: null,
      customForm: undefined,
      customUI: undefined,
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
  },
  watch: {
    customForm() {
      if (!this.forms["Custom"]) {
        this.$set(this.forms, "Custom", {});
      }
      const reader1 = new FileReader();
      reader1.readAsText(this.customForm);
      reader1.onload = evt => {
        this.$set(this.forms["Custom"], "schema", JSON.parse(evt.target.result.toString()))
      };
    },
    customUI() {
      const reader2 = new FileReader();
      reader2.readAsText(this.customUI);
      reader2.onload = evt => {
        this.$set(this.forms["Custom"], "ui",  JSON.parse(evt.target.result.toString()))
      };
    }
  }
}
</script>

<style>

</style>
