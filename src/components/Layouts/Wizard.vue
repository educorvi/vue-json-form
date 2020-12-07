<template>
  <md-steppers md-vertical :md-active-step.sync="step">
    <md-step v-for="(page, index) of ui.pages" :key="index+page.title" :md-label="page.title" :id="index+page.title" :md-done="done[index]">
      <FormWrap :ui="page.content" :json="json"/>
      <b-button variant="primary" class="float-right" @click="() => {step=steps[index+1]; done[index] = true}">Weiter</b-button>
    </md-step>
  </md-steppers>
</template>

<script>
import layoutMixin from "./layoutMixin";

/**
 * Displays the form as a wizard with multiple pages
 * @group Layouts
 */
export default {
  name: "Wizard",
  mixins: [layoutMixin],
  data() {
    return {
      color: "#000",
      done: [],
      step: 0
    }
  },
  computed: {
    steps() {
      return this.ui.pages.map((item, i) => i+item.title);
    }
  },
  components: {
  },
 mounted() {
   this.color = getComputedStyle(document.documentElement).getPropertyValue('--primary');
   this.errorColor = getComputedStyle(document.documentElement).getPropertyValue('--danger');
 },
  // watch: {
  //   "ui.pages": {
  //       handler: function (newValue){
  //         this.done = Array(newValue.length).fill(false, 0, newValue.length - 1);
  //       },
  //     deep: true
  //
  //   }
  // },
}
</script>

<style scoped>

</style>
