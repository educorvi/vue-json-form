<template>
<b-checkbox>{{item.title || fallbackTitle}}</b-checkbox>
</template>

<script>
import formFieldMixin from "./formFieldMixin";

export default {
name: "Boolean",
  mixins: [formFieldMixin]
}
</script>

<style scoped>

</style>