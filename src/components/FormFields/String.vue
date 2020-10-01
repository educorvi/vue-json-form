<template>
  <b-form-textarea v-if="ui.options && ui.options.multi" v-model="fieldData"
                   :rows="typeof ui.options.multi === 'number' ? ui.options.multi : 3" :placeholder="ui.options ? ui.options.placeholder : ''"/>
  <b-input v-model="fieldData" v-else-if="item.format !== 'date-time'" :type="item.format" :placeholder="ui.options ? ui.options.placeholder : ''"/>
  <date-time v-else :json="json" :ui="ui"/>
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
