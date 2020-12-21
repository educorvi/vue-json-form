<template>
  <div>
    <input type="submit" v-if="ui.buttonType==='submit' && !ui.text" :class="`float-right btn btn-${ui.variant || 'primary'}`"/>
    <b-button v-if="ui.buttonType==='submit' && ui.text" type="submit" :variant="ui.variant || 'primary'" class="float-right">{{ui.text}}</b-button>
  </div>
</template>

<script>
import layoutMixin from "./layoutMixin";

export default {
  name: "Button",
  mixins: [layoutMixin]
}
</script>

<style scoped>

</style>