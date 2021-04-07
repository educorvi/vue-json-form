<template>
  <b-card no-body :class="'mb-2 vjf_group '+customCss">
    <b-card-header>
      <h5 class="m-0">{{ ui.label }}</h5>
    </b-card-header>
    <b-card-body>
      <vertical-layout @changedData="loopUp" :json="json" :ui="{...ui, type: 'VerticalLayout'}" :filledData="filledData"
                       :form-i-d="formID"/>
    </b-card-body>

  </b-card>
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
