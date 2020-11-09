<template>
  <b-form v-if="valid || disableValidation" @submit="onSubmit">
    <FormWrap @changedData="saveData" :json="json" :ui="ui || generatedUI"></FormWrap>
    <b-button :variant="colorVariant || 'primary'" class="float-right" type="submit">{{ sendText || 'Send' }}</b-button>
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
      console.log(this.validateJson(obj, uischema));
      return obj;

    }
  },
  props: {
    //Color Variant like defined in Bootstrap-Vue
    colorVariant: {
      type: String
    },
    disableValidation: {
      type: Boolean
    },
    sendText: {
      type: String
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

<style lang="scss" scoped>
.error_card {
  color: black;
  p {
    color: black;
  }
}
</style>
