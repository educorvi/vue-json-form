<template>
<b-form-select v-model="fieldData" :options="options"/>
</template>

<script>
import formFieldMixin from "./formFieldMixin";

export default {
name: "Select",
  mixins: [formFieldMixin],
  computed: {
    options() {
      function getTextForItem(key){
        return key;
      }

      return this.item.enum.map(key => {return {value: key, text: getTextForItem(key)}})
    }
  },
}
</script>

<style scoped>

</style>
