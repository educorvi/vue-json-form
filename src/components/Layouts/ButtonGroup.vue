<template>
<b-button-group :vertical="ui.vertical" class="w-100">
<Button v-for="(button, index) in ui.buttons" :ui="button" :key="'buttongroup_button_'+index"/>
</b-button-group>
</template>

<script>
import layoutMixin from "./layoutMixin";
import Button from "@/components/Layouts/Button.vue";
//@group Layouts
export default {
  name: "ButtonGroup",
  mixins: [layoutMixin],
  components: {Button}
}

</script>

<style scoped>

</style>
