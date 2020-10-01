<template>
  <div>
    <div>
      <b-row>
        <b-col v-for="(item, index) in ui.elements" :key="ui.toString().length+'_'+index">
          <form-wrap @changedData="loopUp" :json="json" :ui="item"></form-wrap>
        </b-col>
      </b-row>
    </div>
  </div>
</template>

<script>
import layout from "./layoutMixin";

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
