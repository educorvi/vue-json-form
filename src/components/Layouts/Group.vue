<template>
  <fieldset :class="'mb-2 vjf_group '+customCss">
    <legend class="m-0">{{ ui.label }}</legend>
    <vertical-layout @changedData="loopUp" :json="json" :ui="{...ui, type: 'VerticalLayout'}" :filledData="filledData"
                     :form-i-d="formID"/>
  </fieldset>
</template>

<script>
import layout from "./layoutMixin.js";

//@group Layouts
/**
 * Layout, that groups multiple form-elements/-layouts in a visible group
 */
export default {
  name: "Group",
  mixins: [layout]
}
</script>

<style scoped>

</style>
