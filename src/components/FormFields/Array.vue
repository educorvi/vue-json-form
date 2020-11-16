<template>
  <div v-if="item.items && item.items.type" class="embDiv w-100">
    <draggable v-model="fieldData" handle=".handle">
      <transition-group name="arrayedit">
        <div v-for="(field, index) in fieldData" :key="field.gentime.toLocaleString()">
          <ArrayItem @changedData="dataChanged(index, $event)" @deleteItem="deleteItem(index)"
                     :divider="index !== fieldData.length-1 && item.items.type === 'object'" :index="index" :json="json"
                     :ui="fakeUI"/>
        </div>
      </transition-group>
    </draggable>
    <b-button :disabled="fieldData.filter(o => o.value === null).length>0" class="w-100" variant="outline-primary"
              @click="addItem">
      <b-icon-plus></b-icon-plus>
    </b-button>
  </div>
  <b-card v-else bg-variant="danger" header="Error" text-variant="white">
    <p>The type of the array's items is missing in the schema</p>
  </b-card>
</template>

<script>
import formFieldMixin from "./formFieldMixin.js";
import draggable from "vuedraggable"
import ArrayItem from "./ArrayItem.vue";

//@group FormFields
/**
 * This is used to Render Arrays
 */
export default {
  name: "Array",
  components: {ArrayItem, draggable},
  mixins: [formFieldMixin],
  computed: {
    //Used to generate a fake UI-Scheme for the Arrayitems
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

    /**
     * Add item to fieldData-Array
     */
    addItem() {
      if (this.fieldData[this.fieldData.length - 1] !== null) this.fieldData.push({value: null, gentime: new Date()});
    },

    /**
     * Delete item from fieldData-Array
     * @param i Index of the item
     */
    deleteItem(i) {
      this.fieldData.splice(i, 1);
    },

    /**
     * Updates field Data on changes in ArrayItems
     * @param index index of the item
     * @param item new Item
     */
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

.embDiv {
  margin-left: 10px;
  padding-left: 10px;
  border-left-style: solid;
  border-left-color: grey;
}

.handle {
  //Do NOT delete!
}

.arrayedit {

}

.arrayedit-enter-active, .arrayedit-leave-active {
  transition: all 0.4s;
}

.arrayedit-enter, .arrayedit-leave-to /* .arrayedit-leave-active below version 2.1.8 */
{
  opacity: 0;
  transform: translateX(30px);
}
</style>
