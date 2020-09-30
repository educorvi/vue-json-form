<template>
  <div id="app" class="container-fluid pt-5">
      <form-root :json="schema" :ui="uischema"></form-root>
  </div>
</template>

<script>

import schema from "../schema.json";
import uischema from "../uischema.json";
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
