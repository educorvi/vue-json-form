<template>
  <b-form-textarea ref="child" v-if="ui.options && ui.options.multi" v-model="fieldData" :name="title"
                   :placeholder="ui.options ? ui.options.placeholder : ''"
                   :rows="typeof ui.options.multi === 'number' ? ui.options.multi : 3"
                   :id="schemaName" class="vjf_textarea"/>
  <b-input ref="child" v-else-if="(ui.format || item.format) !== 'date-time'" v-model="fieldData" :name="title"
           :placeholder="ui.options ? ui.options.placeholder : ''" :type="ui.format || item.format" :id="schemaName"
           class="vjf_text"/>
  <date-time ref="child" v-else :json="json" :ui="ui" @changedData="loopUp" class="vjf_datetime"/>
</template>

<script>
import formFieldMixin from "./formFieldMixin.js";
import DateTime from "./DateTime.vue";

//@group FormFields
/**
 * This renders text-fields and text-areas
 */
export default {
  name: "String",
  components: {DateTime},
  mixins: [formFieldMixin]
}
</script>

<style scoped>

</style>
