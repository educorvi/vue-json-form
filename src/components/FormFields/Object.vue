<template>
  <div class="embDiv">
    <FormWrap :json="json" :ui="fakeUI" @changedData="collect"/>
  </div>
</template>

<script>
import formFieldMixin from "./formFieldMixin.js";

export default {
  name: "Object",
  components: {FormWrap: () => import("../FormWrap.vue")},
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
  methods: {
    collect(data) {
      const s = data.key.split("/");
      if (!this.fieldData) {
        this.fieldData = {};
      }
      this.$set(this.fieldData, s[s.length - 1], data.value);
    }
  },
}
</script>

<style scoped>

</style>
