<template>
  <div id="app" class="container-fluid pt-5" style="max-width: 800px">
      <form-root :json="schema" :ui="uischema"></form-root>
  </div>
</template>

<script>

import schema from "../schema.json";
import uischema from "../ui.json";
import FormRoot from "@/components/FormRoot";
export default {
  name: 'App',
  components: {
    FormRoot
  },
  computed: {
    schema() {
      return schema;
    },
    uischema() {
      return uischema
    }
  },
}
</script>

<style>

</style>
