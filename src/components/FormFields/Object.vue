<template>
  <div class="embDiv">
    <FormWrap :json="json" :ui="fakeUI" @changedData="collect"/>
  </div>
</template>

<script>
import formFieldMixin from "./formFieldMixin.js";

//@group FormFields
/**
 * Is used to render Objects. The object's properties will be rendered with nested formFields
 */
export default {
  name: "Object",
  components: {FormWrap: () => import("../FormWrap.vue")},
  mixins: [formFieldMixin],
  computed: {
    //generated FakeUI for the nested form-fields
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
    //Collects data of properties and saves it into fieldData
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
