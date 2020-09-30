<template>
  <component :is="type" :json="json" :ui="ui" :isInteger="json.type === 'integer'"/>
</template>

<script>
/* eslint-disable no-unused-vars */

import {onlyProps} from "../Layouts/layoutMixin";
import Array from "./Array";
import Boolean from "./Boolean";
import MultibleChoice from "./MultibleChoice";
import Number from "./Number";
import Object from "./Object";
import Radiobuttons from "./Radiobuttons";
import Select from "./Select";
import Textarea from "./Textarea";
import Textfield from "./Textfield";
import defaultField from "./defaultField";

export default {
  name: "FormField",
  mixins: [onlyProps],
  computed: {
    /**
     * Selects the right form field
     */
    type() {
      const type = this.json.type;
      const json = this.json;

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
          //TODO Textarea
          return Textfield;
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