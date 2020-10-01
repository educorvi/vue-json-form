<template>
<div>
  <b-row>
    <b-col cols="6">
      <b-input type="date"/>
    </b-col>
    <b-col cols="6">
      <b-input type="time"/>
    </b-col>
  </b-row>
</div>
</template>

<script>
import formFieldMixin from "@/components/FormFields/formFieldMixin";

export default {
name: "DateTime",
  mixins: [formFieldMixin]
}
</script>

<style scoped>

</style>
