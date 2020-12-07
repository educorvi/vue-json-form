<template>
  <b-form-group :id="'formGroup_'+schemaName"
                :description="item.description"
                :label="item.type !== 'boolean' && (ui.label || ui.label === undefined) ? title : null"
                :label-for="schemaName">
    <b-input-group class="w-100">
      <b-input-group-prepend v-if="hasSlot('prepend')">
<!--        Content is prepended to the input field-->
        <slot name="prepend"></slot>
      </b-input-group-prepend>
      <component :is="type" :id="schemaName" :isInteger="item.type === 'integer'" :json="json" :name="title"
                 :required="required"
                 :ui="ui" @changedData="loopUp" ref="child"/>
      <b-input-group-append :is-text="!noText" v-if="hasSlot()">
<!--        Content is appended to the input field-->
        <slot></slot>
      </b-input-group-append>
    </b-input-group>

  </b-form-group>
</template>

<script>
/* eslint-disable no-unused-vars */

import formFieldMixin from "./formFieldMixin.js";
import Array from "./Array.vue";
import Boolean from "./Boolean.vue";
import MultibleChoice from "./MultibleChoice.vue";
import Number from "./Number.vue";
import Object from "./Object.vue";
import Select from "./Select.vue";
import String from "./String.vue";
import defaultField from "./defaultField.vue";
import Radiobuttons from "./Radiobuttons.vue";

//@group FormFields
/**
 * This is the main form-field, that is always referenced. It decides, which field needs to be rendered
 */
export default {
  name: "FormField",
  mixins: [formFieldMixin],
  methods: {
  },
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
