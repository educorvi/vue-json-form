<template>
  <b-form-textarea v-if="ui.options && ui.options.multi"
                   :rows="typeof ui.options.multi === 'number' ? ui.options.multi : 3"/>
  <b-input v-else-if="item.format !== 'date-time'" :type="item.format"/>
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
