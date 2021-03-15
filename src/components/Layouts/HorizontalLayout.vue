<template>
      <b-row class="vjf_horizontal">
        <b-col v-for="(item, index) in ui.elements" :key="ui.toString().length+'_'+index">
          <form-wrap @changedData="loopUp" :json="json" :ui="item" :filledData="filledData"
                     :form-i-d="formID"></form-wrap>
        </b-col>
      </b-row>
</template>

<script>
import layout from "./layoutMixin.js";

//@group Layouts
/**
 * Layout, that displays its elements horizontally
 */
export default {
  name: "HorizonzalLayout",
  mixins: [layout]
}
</script>

<style scoped>
.col {
  padding: 0;
}
</style>
