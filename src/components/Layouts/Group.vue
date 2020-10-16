<template>
  <b-card no-body class="mb-2">
    <b-card-header>
      <h5 class="m-0">{{ui.label}}</h5>
    </b-card-header>
    <b-card-body>
      <vertical-layout @changedData="loopUp" :json="json" :ui="{...ui, type: 'VerticalLayout'}"/>
    </b-card-body>

  </b-card>
</template>

<script>
import layout from "./layoutMixin.js";

export default {
  name: "Group",
  mixins: [layout]
}
</script>

<style scoped>

</style>
