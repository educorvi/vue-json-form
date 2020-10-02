<template>
  <b-form-group :id="'formGroup_'+schemaName"
                :description="item.description"
                :label="item.type !== 'boolean' && (ui.label || ui.label === undefined) ? title : null"
                :label-for="schemaName">
    <b-input-group class="w-100">
      <b-input-group-prepend v-if="hasSlot('prepend')">
        <slot name="prepend"></slot>
      </b-input-group-prepend>
      <component :is="type" :id="schemaName" :isInteger="item.type === 'integer'" :json="json" :name="title"
                 :required="required"
                 :ui="ui" @changedData="loopUp"/>
      <b-input-group-append v-if="hasSlot()">
        <slot></slot>
      </b-input-group-append>
    </b-input-group>

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
import Select from "./Select";
import String from "./String";
import defaultField from "./defaultField";
import Radiobuttons from "@/components/FormFields/Radiobuttons";

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
      if (json.enum !== undefined && type !== "array") {
        if (this.ui.options?.radiobuttons) {
          return Radiobuttons;
        } else {
          return Select;
        }
      }
      if (json.items?.enum !== undefined && type === "array") {
        return MultibleChoice;
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
