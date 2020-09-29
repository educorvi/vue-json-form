<template>
  <b-card no-body>
    <b-card-header>
      <h5 class="m-0">{{ui.label}}</h5>
    </b-card-header>
    <b-card-body>
      <vertical-layout :json="json" :ui="{...ui, type: 'VerticalLayout'}"/>
    </b-card-body>

  </b-card>
</template>

<script>
import layout from "@/components/Layouts/layout";

export default {
  name: "Group",
  mixins: [layout]
}
</script>

<style scoped>

</style>
