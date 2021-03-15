<template>
  <div>
    <!-- Uses automatic translation of the button provided by browser -->
    <input type="submit" v-if="ui.buttonType==='submit' && !ui.text"
           :class="`vjf_button float-right btn btn-${ui.variant || 'primary'}`"/>
<!--    Uses text of ui schema-->
    <b-button v-if="ui.buttonType==='submit' && ui.text" type="submit" :variant="ui.variant || 'primary'"
              class="float-right vjf_button">{{ ui.text }}
    </b-button>
  </div>
</template>

<script>
import layoutMixin from "./layoutMixin";
//@group Layouts
export default {
  name: "Button",
  mixins: [layoutMixin]
}
</script>

<style scoped>

</style>
