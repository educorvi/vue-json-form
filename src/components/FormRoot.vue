<template>
  <b-form v-if="valid || disableValidation" @submit="onSubmit">
    <FormWrap :json="json" :ui="ui"></FormWrap>
    <b-button :variant="colorVariant || 'primary'" class="float-right" type="submit">Send</b-button>
  </b-form>
  <b-jumbotron v-else-if="validationResults" bg-variant="danger" header="Error"
               lead="Validation of the form's schema failed with the following errors:"
               text-variant="white">
    <h4 v-if="validationResults.schema.errors.length>0">JSON-Schema:</h4>
    <b-card v-for="(error, index) in validationResults.schema.errors" :key="error.stack+index" :header="error.property"
            class="error_card mb-3">"{{ error.instance }}" <br><b>{{ error.message }}</b>
    </b-card>
    <h4 class="mt-4" v-if="validationResults.ui.errors.length>0">UI-Schema:</h4>
    <b-card v-for="(error, index) in validationResults.ui.errors" :key="error.stack+index" :header="error.property"
            class="error_card mb-3">"{{ error.instance }}" <br><b>{{ error.message }}</b>
    </b-card>
  </b-jumbotron>
</template>

<script>
import FormWrap from "./FormWrap";
import {onlyProps} from "./Layouts/layoutMixin";
import schemadraft from "../schemas/json-schema_draft7.json";
import uischema from "../schemas/uischema.json"

export default {
  name: "FormRoot",
  components: {FormWrap},
  mixins: [onlyProps],
  data() {
    return {
      validationResults: {
        schema: null,
        ui: null
      }
    }
  },
  computed: {
    valid() {
      return ((this.validationResults.schema ? this.validationResults.schema.errors.length : 0)
          + (this.validationResults.ui ? this.validationResults.ui.errors.length : 0)) === 0;

    }
  },
  props: {
    //Color Variant like defined in Bootstrap-Vue
    colorVariant: {
      type: String,
      required: false
    },
    disableValidation: {
      type: Boolean
    }
  },
  methods: {
    onSubmit(evt) {
      evt.preventDefault();
      console.log("send");
    },
    validateJson(json, schema = schemadraft) {
      const validate = require('jsonschema').validate;
      return validate(json, schema);
    }
  },
  created() {
    this.validationResults.schema = this.validateJson(this.json);
    this.validationResults.ui = this.validateJson(this.ui, uischema);
  },
  watch: {
    json(newValue) {
      this.validateJson(newValue);
    },
    ui(newValue) {
      this.validateJson(newValue);
    }
  },
}
</script>

<style scoped>
.error_card {
  color: black;
}
</style>
