<template>
  <b-form v-if="valid || disableValidation" @submit="onSubmitMeth" novalidate :id="id" :validated="checked">
    <FormWrap :filledData="data" @changedData="saveData" :json="json" :ui="ui || generatedUI" :formID="id"></FormWrap>
    <!--    Slot inside the form below the generated content. Meant for Submit Button and similar additions-->
    <slot>
      <!--   Default Submit Button. Only rendered when no other submit button was specified in the form-->
      <input v-if="!containsSubmitButton" type="submit" class="float-right btn btn-primary"/>
    </slot>
  </b-form>


  <b-jumbotron v-else-if="validationResults" bg-variant="danger" header="Error"
               lead="Validation of the form's schema failed with the following errors:"
               text-variant="white">
    <h4 v-if="validationResults.schema.errors.length>0">JSON-Schema:</h4>
    <b-card v-for="(error, index) in validationResults.schema.errors" :key="error.stack+index" :header="error.property"
            class="error_card mb-3">
      <p>"{{ error.instance }}" <br>
        <b>{{ error.message }}</b>
      </p>
    </b-card>
    <h4 class="mt-4" v-if="validationResults.ui.errors.length>0">UI-Schema:</h4>
    <b-card v-for="(error, index) in validationResults.ui.errors" :key="error.stack+index" :header="error.property"
            class="error_card mb-3">
      <p>"{{ error.instance }}" <br>
        <b>{{ error.message }}</b>
      </p>
    </b-card>
  </b-jumbotron>
</template>

<script>
import FormWrap from "./FormWrap.vue";
import {rootProps} from "./Layouts/layoutMixin.js";
import schemadraft from "../schemas/json-schema_draft7.json";
import uischema from "../schemas/ui/ui.schema.json"
import control from "../schemas/ui/control.schema.json"
import html from "../schemas/ui/html.schema.json"
import divider from "../schemas/ui/divider.schema.json"
import layout from "../schemas/ui/layout.schema.json"
import wizard from "../schemas/ui/wizard.schema.json"
import wizardPage from "../schemas/ui/wizard_page.schema.json"
import showOn from "../schemas/ui/show_on.schema.json"
import button from "../schemas/ui/button.schema.json"

/**
 * This is the Root Component and the interface to the "outside". Generates UI if necessary and renders form.
 * When submitted (for example by slot with `type=submit` in the default slot), a call of the method passed in prop `onSubmit` will be triggered, passing the data as first argument
 */
export default {
  name: "FormRoot",
  components: {FormWrap},
  mixins: [rootProps],
  data() {
    return {
      validationResults: {
        schema: null,
        ui: null
      },
      data: {},
      id: "",
      checked: false
    }
  },
  computed: {
    valid() {
      return ((this.validationResults.schema ? this.validationResults.schema.errors.length : 0)
          + (this.validationResults.ui ? this.validationResults.ui.errors.length : 0)) === 0;

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
        const keys = Object.keys(obj);
        for (const key of keys) {
          let item = obj[key];
          if (typeof item === 'object') {
            if(searchInObject(item)) return true;
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
    //Disables the validation of json-schema and ui-schema
    disableValidation: {
      type: Boolean,
      default: false
    },
    //Method that is called, when the Form is submitted. Passes the formdata as first Argument
    onSubmit: {
      type: Function,
      required: true
    }
  },
  methods: {
    onSubmitMeth(evt) {
      evt.preventDefault();
      const form = document.getElementById(this.id);
      if (form.checkValidity()) {
        this.onSubmit(this.data);
      } else {
        // this.checked = true;
        form.reportValidity();
      }
    },
    validateJson(json, schema = schemadraft) {
      const validate = require('jsonschema').validate;
      return validate(json, schema);
    },
    validateUI(ui) {
      const Validator = require('jsonschema').Validator;
      const v = new Validator();
      v.addSchema(layout, "https://educorvi.github.io/vue_json_form/schemas/layout.schema.json");
      v.addSchema(control, "https://educorvi.github.io/vue_json_form/schemas/control.schema.json");
      v.addSchema(html, "https://educorvi.github.io/vue_json_form/schemas/html.schema.json");
      v.addSchema(divider, "https://educorvi.github.io/vue_json_form/schemas/divider.schema.json");
      v.addSchema(wizard, "https://educorvi.github.io/vue_json_form/schemas/wizard.schema.json");
      v.addSchema(wizardPage, "https://educorvi.github.io/vue_json_form/schemas/wizard_page.schema.json");
      v.addSchema(showOn, "https://educorvi.github.io/vue_json_form/schemas/show_on.schema.json");
      v.addSchema(button, "https://educorvi.github.io/vue_json_form/schemas/button.schema.json");
      return v.validate(ui, uischema)
    },
    saveData(data) {
      this.$set(this.data, data.key, data.value)
    }
  },
  created() {
    this.validationResults.schema = this.validateJson(this.json);
    if (this.ui) {
      this.validationResults.ui = this.validateUI(this.ui);
    }
    this.id = '_' + Math.random().toString(36).substr(2, 9);
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
