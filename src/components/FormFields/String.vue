<template>
  <b-form-textarea v-if="ui.options && ui.options.multi" :rows="typeof ui.options.multi === 'number' ? ui.options.multi : 3"/>
  <b-input :type="item.format" v-else/>
</template>

<script>
import formFieldMixin from "./formFieldMixin";

export default {
  name: "String",
  mixins: [formFieldMixin]
}
</script>

<style scoped>

</style>
