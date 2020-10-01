<template>
  <div class="arrDiv w-100" v-if="item.items && item.items.type">
    <div v-for="(item, index) in fieldData" :key="item.gentime.toLocaleString()">
      <FormField :json="json" :name="schemaName+index" :ui="fakeUI" @changedData="dataChanged(index, $event)">
        <b-button variant="outline-danger" @click="deleteItem(index)">
          <b-icon icon="x"/>
        </b-button>
      </FormField>
      <hr v-if="index !== fieldData.length-1">
    </div>
    <b-button :disabled="fieldData.filter(o => o.value === null).length>0" variant="outline-primary" @click="addItem">+</b-button>
  </div>
  <b-card v-else header="Error" bg-variant="danger" text-variant="white">
    <p>The type of the array's items is missing in the schema</p>
  </b-card>
</template>

<script>
import formFieldMixin from "./formFieldMixin";

export default {
  name: "Array",
  components: {FormField: () => import('../FormFields/FormField')},
  mixins: [formFieldMixin],
  computed: {
    fakeUI() {
      return {
        label: false,
        scope: this.jsonPath + "/items"
      };
    }
  },
  methods: {
    addItem() {
      if(this.fieldData[this.fieldData.length-1]!==null) this.fieldData.push({value: null, gentime: new Date()});
    },
    deleteItem(i) {
      this.fieldData.splice(i, 1);
      console.log("delete " + i)
    },
    dataChanged(index, item) {
      console.log(index + ' Data: ' + JSON.stringify(item.value));
      const time = this.fieldData[index] ? this.fieldData[index].gentime : new Date();
      this.$set(this.fieldData, index, {value: item.value, gentime: time});
    }
  },
  created() {
    this.fieldData = [];
  }
}
</script>

<style lang="scss">
@import "./src/styles";

.arrDiv {
  margin-left: 10px;
  padding-left: 10px;
  border-left-style: solid;
  border-left-color: grey;
}
</style>
