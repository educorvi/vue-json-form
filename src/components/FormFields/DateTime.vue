<template>
  <div :name="title" :id="schemaName">
    <b-input v-model="fieldData" style="border-bottom-left-radius: 0; border-bottom-right-radius: 0" type="datetime-local" :required="required" :min="item.minimum" :max="item.maximum"/>
  </div>
</template>

<script>
import formFieldMixin from "./formFieldMixin.js";

//@group FormFields
/**
 * This is used to render date-time-fields
 */
export default {
  name: "DateTime",
  mixins: [formFieldMixin]
}
</script>

<style scoped>

</style>
