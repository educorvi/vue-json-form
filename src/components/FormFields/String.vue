<template>
  <b-form-textarea v-if="ui.options && ui.options.multi" v-model="fieldData" :name="title"
                   :placeholder="ui.options ? ui.options.placeholder : ''"
                   :rows="typeof ui.options.multi === 'number' ? ui.options.multi : 3"/>
  <b-input v-else-if="(ui.format || item.format) !== 'date-time'" v-model="fieldData" :name="title"
           :placeholder="ui.options ? ui.options.placeholder : ''" :type="ui.format || item.format"/>
  <date-time v-else :json="json" :ui="ui" @changedData="loopUp"/>
</template>

<script>
import formFieldMixin from "./formFieldMixin";
import DateTime from "@/components/FormFields/DateTime";

export default {
  name: "String",
  components: {DateTime},
  mixins: [formFieldMixin]
}
</script>

<style scoped>

</style>
