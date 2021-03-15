<template>
  <b-form-group :id="'formGroup_'+schemaName"
                :description="item.description"
                :label="item.type !== 'boolean' && (ui.options === undefined || ui.options.label || ui.options.label === undefined) ? title : null"
                :label-for="schemaName" class="vjf_formField">
    <b-input-group class="w-100">
      <b-input-group-prepend v-if="hasSlot('prepend')">
        <!--        Content is prepended to the input field-->
        <slot name="prepend"></slot>
      </b-input-group-prepend>
      <component :is="type" :isInteger="item.type === 'integer'" :json="json" :name="title" :class="!(hasSlot() || hasSlot('prepend'))?'w-100':''"
                 :required="required"
                 :ui="ui" @changedData="loopUp" ref="child" :filledData="filledData"
                 :autocomplete="(ui.options ||{}).autocomplete || 'on'"
                 :style="cssStyle"/>
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
import Boolean from "./Checkbox.vue";
import MultibleChoice from "./Checkboxes.vue";
import Number from "./Number.vue";
import Object from "./Object.vue";
import Select from "./Select.vue";
import String from "./String.vue";
import defaultField from "./defaultField.vue";
import Radiobuttons from "./Radiobuttons.vue";
import Tags from "./Tags.vue";
import File from "./File.vue";

//@group FormFields
/**
 * This is the main form-field, that is always referenced. It decides, which field needs to be rendered
 */
export default {
  name: "FormField",
  mixins: [formFieldMixin],
  methods: {},
  mounted() {
    let toFill;
    if (this.array !== undefined) {
      let arrayData = this.ui.scope.split("/");
      arrayData.splice(arrayData.length - 1, 1);
      arrayData = "#" + arrayData.join("/");
      if (this.filledData && (toFill = this.filledData[arrayData]) !== undefined && arrayData.length > this.array) {
        this.$refs.child.fieldData = toFill[this.array];
      }
    } else if (this.filledData && (toFill = this.filledData[this.ui.scope]) !== undefined) {
      this.$refs.child.fieldData = toFill;
    }
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
        if (this.ui.options?.radiobuttons || this.ui.options?.buttons) {
          return Radiobuttons;
        } else {
          return Select;
        }
      }

      if (type === 'array' && this.ui.options?.tags?.enabled) {
        return Tags;
      }

      if (type === 'string' && this.item.format === 'uri') {
        return File;
      }

      switch (type) {
        case "boolean":
          return Boolean;
        case "number":
          return Number;
        case "integer":
          return Number;
        case "object":
          return Object;
        case "string":
          return String;
        case "array":
          return (json.enum === undefined) ? Array : MultibleChoice;
        default:
          return defaultField;
      }
    },
    cssStyle() {
      if (this.ui.options?.textAlign) {
        return 'text-align: ' + this.ui.options?.textAlign;
      } else {
        return '';
      }
    }
  },
}
</script>

<style scoped>

</style>
