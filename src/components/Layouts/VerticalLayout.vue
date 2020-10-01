<template>
  <div>
    <form-wrap @changedData="loopUp" v-for="(item, index) in ui.elements" :ui="item" :json="json" :key="ui.toString().length+'_'+index"></form-wrap>
  </div>
</template>

<script>
/* eslint-disable vue/no-unused-components */

import layoutMixin from "./layoutMixin";
export default {
  name: "VerticalLayout",
  components: {
    FormWrap: () => import('../FormWrap')
  },
  mixins: [layoutMixin]
}
</script>

<style scoped>

</style>
