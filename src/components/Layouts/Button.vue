<template>
  <div>
    <!-- Uses automatic translation of the button provided by browser -->
    <input :type="ui.buttonType" v-if="!ui.text"
           :class="`vjf_button float-right btn btn-${ui.variant || 'primary'}`"
           :formaction="ui.nativeSubmitSettings?.formaction"
           :formmethod="ui.nativeSubmitSettings?.formmethod"
           :formtarget="ui.nativeSubmitSettings?.formtarget"
           :formenctype="ui.nativeSubmitSettings?.formenctype"
    />
    <!--    Uses text of ui schema-->
    <b-button v-else :type="ui.buttonType" :variant="ui.variant || 'primary'"
              class="float-right vjf_button"
              :formaction="ui.nativeSubmitSettings?.formaction"
              :formmethod="ui.nativeSubmitSettings?.formmethod"
              :formtarget="ui.nativeSubmitSettings?.formtarget"
              :formenctype="ui.nativeSubmitSettings?.formenctype"
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
