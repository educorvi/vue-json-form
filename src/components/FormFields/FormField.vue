<template>
  <b-form-group :id="'formGroup_'+schemaName" :label="item.type !== 'boolean' ? title : null" :description="item.description" :label-for="schemaName">
    <component :is="type" :json="json" :ui="ui" :isInteger="item.type === 'integer'" :id="schemaName" :placeholder="item.placeholder"/>
  </b-form-group>
</template>

<script>
/* eslint-disable no-unused-vars */

import formFieldMixin from "./formFieldMixin";
import Array from "./Array";
import Boolean from "./Boolean";
import MultibleChoice from "./MultibleChoice";
import Number from "./Number";
import Object from "./Object";
import Radiobuttons from "./Radiobuttons";
import Select from "./Select";
import String from "./String";
import defaultField from "./defaultField";

export default {
  name: "FormField",
  mixins: [formFieldMixin],
  computed: {
    /**
     * Selects the right form field
     */
    type() {
      const type = this.item.type;
      const json = this.item;

      //Special Treatment for Enums
      if(json.enum !== undefined && type !== "array"){
        //TODO Radiobutton
        return Select;
      }

      switch (type) {
        case "boolean":
          return Boolean;
        case "number":
          return Number;
        case "integer":
          return Number;
        case "object":
          return Object
        case "string":
          return String;
        case "array":
          return (json.enum === undefined) ? Array : MultibleChoice;

        default:
          return defaultField;
      }


    }
  },
}
</script>

<style scoped>

</style>
