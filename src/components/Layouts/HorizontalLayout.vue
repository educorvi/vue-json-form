<template>
  <div>
    <b-container fluid="true">
      <b-row>
        <b-col v-for="(item, index) in ui.elements" :key="ui.toString().length+'_'+index">
          <form-wrap :json="json" :ui="item"></form-wrap>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import layout from "./layout";

export default {
  name: "HorizonzalLayout",
  mixins: [layout]
}
</script>

<style scoped>

</style>
