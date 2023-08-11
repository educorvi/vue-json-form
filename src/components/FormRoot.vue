<template>
  <b-form v-if="valid || disableValidation" @submit="onSubmitMeth" novalidate :id="id" :validated="checked"
          class="vjf_root">
    <FormWrap :filledData="data" @changedData="saveData" :json="json" :ui="ui || generatedUI" :formID="id"></FormWrap>
    <!--    Slot inside the form below the generated content. Meant for Submit Button and similar additions-->
    <slot>
      <!--   Default Submit Button. Only rendered when no other submit button was specified in the form-->
      <input v-if="!containsSubmitButton" type="submit" class="float-right btn btn-primary"/>
    </slot>
  </b-form>


  <b-jumbotron v-else-if="validationResults && validationResults.schema && validationResults.ui" bg-variant="danger"
               header="Error"
               lead="Validation of the form's schema failed with the following errors:"
               text-variant="white">
    <h4 v-if="validationResults.schema.length>0">JSON-Schema:</h4>
    <b-card v-for="(error, index) in validationResults.schema" :key="index" :header="error.message"
            class="error_card mb-3">
      <span v-html="jsonToHtml(error)"/>
    </b-card>
    <h4 class="mt-4" v-if="validationResults.ui.length>0">UI-Schema:</h4>
    <b-card v-for="(error, index) in validationResults.ui" :key="index" :header="error.message"
            class="error_card mb-3">
      <span v-html="jsonToHtml(error)"/>
    </b-card>
  </b-jumbotron>
</template>

<script>
import FormWrap from "./FormWrap.vue";
import Ajv from "ajv";
// import addFormats from "ajv-formats"
import {rootProps} from "./Layouts/layoutMixin.js";
// import schemadraft from "../schemas/json-schema_draft7.json";
import uischema from "../schemas/ui/ui.schema.json"
import control from "../schemas/ui/control.schema.json"
import html from "../schemas/ui/html.schema.json"
import divider from "../schemas/ui/divider.schema.json"
import layout from "../schemas/ui/layout.schema.json"
import wizard from "../schemas/ui/wizard.schema.json"
import wizardPage from "../schemas/ui/wizard_page.schema.json"
import showOn from "../schemas/ui/show_on.schema.json"
import button from "../schemas/ui/button.schema.json"
import variants from "../schemas/ui/variants.schema.json"
import {prettyPrintJson} from 'pretty-print-json';

/**
 * This is the Root Component and the interface to the "outside". Generates UI if necessary and renders form.
 * When submitted (for example by slot with `type=submit` in the default slot), a call of the method passed in prop `onSubmit` will be triggered, passing the data as first argument
 */
export default {
  name: "FormRoot",
  components: {FormWrap},
  mixins: [rootProps],
  data() {
    const ui_ajv = new Ajv({
      schemas: [uischema, control, html, divider, layout, wizard, wizardPage, showOn, button, variants],
      strict: "log",
      formats: {"json-pointer": true}
    })
    // addFormats(ui_ajv)
    return {
      ui_schema_validate: ui_ajv.getSchema(uischema["$id"]),
      validationResults: {
        schema: [],
        ui: []
      },
      data: {
        ...this.filledData
      },
      id: "",
      checked: false
    }
  },
  computed: {
    valid() {
      return ((this.validationResults.schema ? this.validationResults.schema.length : 0)
          + (this.validationResults.ui ? this.validationResults.ui.length : 0)) === 0;

    },
    generatedUI() {
      const form = this.json;
      const obj = {
        type: "VerticalLayout",
        elements: []
      };
      for (const formElement of Object.keys(form.properties)) {
        obj.elements.push({
          type: "Control",
          scope: "#/properties/" + formElement
        })
      }
      return obj;
    },
    containsSubmitButton() {
      function searchInObject(obj) {
        if (!obj) {
          return false;
        }
        const keys = Object.keys(obj);
        for (const key of keys) {
          let item = obj[key];
          if (typeof item === 'object') {
            if (searchInObject(item)) return true;
          } else if (typeof item === 'string' && key === "buttonType" && item === 'submit') {
            return true;
          }
        }
        return false;
      }

      return searchInObject(this.ui);
    }
  },
  props: {
    /** Disables the validation of json-schema and ui-schema **/
    disableValidation: {
      type: Boolean,
      default: false
    },
    /** Method that is called, when the Form is submitted. Passes the formdata as first Argument **/
    onSubmit: {
      type: Function,
      required: true
    },
    /** do not prevent the default html form action **/
    executeDefaultSubmitAction: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  methods: {
    onSubmitMeth(evt) {
      const form = document.getElementById(this.id);
      if (form.checkValidity()) {
        if (!this.executeDefaultSubmitAction) {
          evt.preventDefault();
        }
        this.onSubmit(this.data);
      } else {
        // this.checked = true;
        evt.preventDefault();
        form.reportValidity();
      }
    },
    validateJson(json) {
      if (this.disableValidation) return;
      const jajv = new Ajv();
      // addFormats(jajv);
      const valid = jajv.validateSchema(json)
      if (!valid) {
        this.validationResults.schema = jajv.errors
      }
    },
    validateUI(ui) {
      if (this.disableValidation) return;
      const valid = this.ui_schema_validate(ui)
      if (!valid) {
        this.validationResults.ui = this.ui_schema_validate.errors
      }
    },
    saveData(data) {
      this.$set(this.data, data.key, data.value)
    },
    jsonToHtml(json) {
      return prettyPrintJson.toHtml(json);
    },
  },
  created() {
    this.validateJson(this.json);
    if (this.ui) {
      this.validateUI(this.ui);
    }
    this.id = '_' + Math.random().toString(36).substring(2, 12);
  },
  watch: {
    json(newValue) {
      this.validateJson(newValue);
    },
    ui(newValue) {
      this.validateUI(newValue);
    }
  }
}
</script>

<style lang="scss">
.error_card {
  color: black !important;

  p {
    color: black !important;
  }
}
</style>
