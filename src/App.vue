<template>
  <div id="app" class="container-fluid pt-5" style="max-width: 800px" v-if="schema && uischema">
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
  data() {
    return {
      schema: null,
      uischema: null
    }
  },
  created() {
    this.schema = schema;
    this.uischema = uischema;
  }
}
</script>

<style>

</style>
