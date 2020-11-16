<template>
  <b-form v-if="valid || disableValidation" @submit="onSubmitMeth">
    <FormWrap @changedData="saveData" :json="json" :ui="ui || generatedUI"></FormWrap>
<!--    Slot inside the form below the generated content. Meant for Submit Button and similar additions-->
    <slot>
<!--      `<input type="submit" class="float-right btn btn-primary"/>`-->
      <input type="submit" class="float-right btn btn-primary"/>
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
import {onlyProps} from "./Layouts/layoutMixin.js";
import schemadraft from "../schemas/json-schema_draft7.json";
import uischema from "../schemas/uischema.json"

/**
 * This is the Root Component and the interface to the "outside". Generates UI if necessary and renders form.
 * When submitted (for example by slot with `type=submit` in the default slot), a call of the method passed in prop `onSubmit` will be triggered, passing the data as first argument
 */
export default {
  name: "FormRoot",
  components: {FormWrap},
  mixins: [onlyProps],
  data() {
    return {
      validationResults: {
        schema: null,
        ui: null
      },
      data: {}
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
          scope: "#/properties/"+formElement
        })
      }
      return obj;

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
      this.onSubmit(this.data);
    },
    validateJson(json, schema = schemadraft) {
      const validate = require('jsonschema').validate;
      return validate(json, schema);
    },
    saveData(data) {
      this.$set(this.data, data.key, data.value)
    }
  },
  created() {
    this.validationResults.schema = this.validateJson(this.json);
    if (this.ui) {
      this.validationResults.ui = this.validateJson(this.ui, uischema);
    }
  },
  watch: {
    json(newValue) {
      this.validateJson(newValue);
    },
    ui(newValue) {
      this.validateJson(newValue, uischema);
    }
  },
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
