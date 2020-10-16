<template>
  <div>
    <FormField ref="child" :json="json" :name="schemaName+index" :ui="ui"
               @changedData="loopUp">
      <b-button variant="outline-danger" @click="$emit('deleteItem', index)">
        <b-icon icon="x"/>
      </b-button>
      <template v-slot:prepend>
        <b-button class="handle" disabled variant="outline-secondary">
          <b-icon-grip-vertical></b-icon-grip-vertical>
        </b-button>
      </template>
    </FormField>
    <hr v-if="divider">
  </div>
</template>

<script>
import formFieldMixin from "./formFieldMixin";

export default {
  name: "ArrayItem",
  mixins: [formFieldMixin],
  components: {FormField: () => import("./FormField")},
  props: {
    index: {
      type: Number,
      required: true
    },
    divider: {
      type: Boolean
    }
  },
  mounted() {
    //TODO First one doesnt Focus
    this.$refs.child?.focus();
  },
}
</script>

<style scoped>

</style>
