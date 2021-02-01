<template>
  <b-form-group :id="'formGroup_'+schemaName"
                :description="item.description"
                :label="item.type !== 'boolean' && (ui.options === undefined || ui.options.label || ui.options.label === undefined) ? title : null"
                :label-for="schemaName">
    <b-input-group class="w-100">
      <b-input-group-prepend v-if="hasSlot('prepend')">
        <!--        Content is prepended to the input field-->
        <slot name="prepend"></slot>
      </b-input-group-prepend>
      <component :is="type" :class="schemaName" :isInteger="item.type === 'integer'" :json="json" :name="title"
                 :required="required"
                 :ui="ui" @changedData="loopUp" ref="child" :filledData="filledData"/>
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
// import Array from "./Array.vue";
// import Boolean from "./Boolean.vue";
// import MultibleChoice from "./MultibleChoice.vue";
// import Number from "./Number.vue";
// import Object from "./Object.vue";
// import Select from "./Select.vue";
// import String from "./String.vue";
// import defaultField from "./defaultField.vue";
// import Radiobuttons from "./Radiobuttons.vue";
// import Tags from "./Tags.vue";
// import File from "./File.vue";

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
          return () => import("./Radiobuttons.vue");
        } else {
          return () => import("./Select.vue");
        }
      }

      if (type === 'array' && this.ui.options?.tags?.enabled) {
        return () => import("./Tags.vue");
      }

      if (type === 'string' && this.item.format === 'uri') {
        return () => import("./File.vue");
      }

      switch (type) {
        case "boolean":
          return () => import("./Boolean.vue");
        case "number":
          return () => import("./Number.vue");
        case "integer":
          return () => import("./Number.vue");
        case "object":
          return () => import("./Object.vue");
        case "string":
          return () => import("./String.vue");
        case "array":
          return (json.enum === undefined) ? () => import("./Array.vue") : () => import("./MultibleChoice.vue");

        default:
          return () => import("./defaultField.vue");
      }
    }
  },
}
</script>

<style scoped>

</style>
