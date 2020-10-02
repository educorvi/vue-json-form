<template>
  <div class="embDiv">
    <FormWrap :json="json" :ui="fakeUI"/>
  </div>
</template>

<script>
import formFieldMixin from "./formFieldMixin";

export default {
  name: "Object",
  components: {FormWrap : () => import("../FormWrap")},
  mixins: [formFieldMixin],
  computed: {
    fakeUI() {
      const elements = [];
      for (let key of Object.keys(this.item.properties)) {
        elements.push({
          type: "Control",
          scope: this.ui.scope + "/properties/" + key
        })
      }

      return {elements, type: "VerticalLayout"}
    }
  },
}
</script>

<style scoped>

</style>
