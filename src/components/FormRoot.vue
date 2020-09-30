<template>
  <b-form @submit="onSubmit" v-if="valid || disableValidation">
    <FormWrap :json="json" :ui="ui"></FormWrap>
    <b-button :variant="colorVariant || 'primary'" type="submit">Send</b-button>
  </b-form>
  <b-jumbotron v-else-if="validationResults" header="Error" bg-variant="danger" text-variant="white" lead="Validation of the form's schema failed with the following errors:">
    <b-card class="error_card mb-3" v-for="(error, index) in validationResults.errors" :key="error.stack+index" :header="error.property">"{{error.instance}}" {{error.message}}</b-card>
  </b-jumbotron>
</template>

<script>
import FormWrap from "./FormWrap";
import {onlyProps} from "./Layouts/layoutMixin";
import schemadraft from "../json-schema_draft7.json";

export default {
  name: "FormRoot",
  components: {FormWrap},
  mixins: [onlyProps],
  data() {
    return {
      validationResults: null
    }
  },
  computed: {
    valid() {
      return this.validationResults ? !this.validationResults.errors.length>0 : false;
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
    validateJson(json) {
      const validate = require('jsonschema').validate;
      this.validationResults = validate(json, schemadraft);
    }
  },
  created() {
    this.validateJson(this.json);
  },
  watch: {
    json(newValue) {
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