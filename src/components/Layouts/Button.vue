<template>
  <div>
    <!-- Uses automatic translation of the button provided by browser -->
    <input :type="ui.buttonType" v-if="!ui.text"
           :class="`vjf_button float-right btn btn-${ui.variant || 'primary'}`"
           :formaction="ui.nativeSubmitSettings?ui.nativeSubmitSettings.formaction:undefined"
           :formmethod="ui.nativeSubmitSettings?ui.nativeSubmitSettings.formmethod:undefined"
           :formtarget="ui.nativeSubmitSettings?ui.nativeSubmitSettings.formtarget:undefined"
           :formenctype="ui.nativeSubmitSettings?ui.nativeSubmitSettings.formenctype:undefined"
    />
    <!--    Uses text of ui schema-->
    <b-button v-else :type="ui.buttonType" :variant="ui.variant || 'primary'"
              class="float-right vjf_button"
              :formaction="ui.nativeSubmitSettings?ui.nativeSubmitSettings.formaction:undefined"
              :formmethod="ui.nativeSubmitSettings?ui.nativeSubmitSettings.formmethod:undefined"
              :formtarget="ui.nativeSubmitSettings?ui.nativeSubmitSettings.formtarget:undefined"
              :formenctype="ui.nativeSubmitSettings?ui.nativeSubmitSettings.formenctype:undefined"
    >
      {{ ui.text }}
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
