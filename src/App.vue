<template>
  <div id="app" class="container-fluid">
      <Form :json="schema" :ui="uischema"></Form>
  </div>
</template>

<script>

import Form from "@/components/Form";
import schema from "../schema.json";
import uischema from "../uischema.json";
export default {
  name: 'App',
  components: {
    Form
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
