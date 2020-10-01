<template>
  <div v-if="item.items && item.items.type" class="arrDiv w-100">
    <draggable v-model="fieldData" handle=".handle">
      <div v-for="(item, index) in fieldData" :key="item.gentime.toLocaleString()">
        <FormField :json="json" :name="schemaName+index" :ui="fakeUI" @changedData="dataChanged(index, $event)">
          <b-button variant="outline-danger" @click="deleteItem(index)">
            <b-icon icon="x"/>
          </b-button>
          <template v-slot:prepend>
            <b-button class="handle" variant="outline-secondary" disabled><b-icon-grip-vertical></b-icon-grip-vertical></b-button>
          </template>
        </FormField>
<!--        <hr v-if="index !== fieldData.length-1">-->
      </div>
    </draggable>
    <b-button  class="w-100"  :disabled="fieldData.filter(o => o.value === null).length>0" variant="outline-primary" @click="addItem">
      <b-icon-plus></b-icon-plus>
    </b-button>
  </div>
  <b-card v-else bg-variant="danger" header="Error" text-variant="white">
    <p>The type of the array's items is missing in the schema</p>
  </b-card>
</template>

<script>
import formFieldMixin from "./formFieldMixin";
import draggable from "vuedraggable"

export default {
  name: "Array",
  components: {FormField: () => import('../FormFields/FormField'), draggable},
  mixins: [formFieldMixin],
  computed: {
    fakeUI() {
      return {
        label: false,
        scope: this.jsonPath + "/items"
      };
    }
  },
  data() {
    return {
      isArray: true
    }
  },
  methods: {
    addItem() {
      if (this.fieldData[this.fieldData.length - 1] !== null) this.fieldData.push({value: null, gentime: new Date()});
    },
    deleteItem(i) {
      this.fieldData.splice(i, 1);
    },
    dataChanged(index, item) {
      const time = this.fieldData[index] ? this.fieldData[index].gentime : new Date();
      this.$set(this.fieldData, index, {value: item.value, gentime: time});
    },

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
.handle {

}
</style>
