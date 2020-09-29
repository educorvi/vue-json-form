<template>
  <div id="app" class="container-fluid">
      <form-wrap :json="schema" :ui="uischema"></form-wrap>
  </div>
</template>

<script>

import schema from "../schema.json";
import uischema from "../uischema.json";
import FormWrap from "@/components/FormWrap";
export default {
  name: 'App',
  components: {
    FormWrap

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
