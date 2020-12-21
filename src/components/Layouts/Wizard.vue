<template>
  <md-steppers md-vertical :md-active-step.sync="step" md-linear>
    <md-step v-for="(page, index) of ui.pages" :key="index+page.title" :md-label="page.title" :id="index+page.title" :md-done="done[index]" :md-editable="index <= steps.indexOf(step)">
      <FormWrap v-if="index === steps.indexOf(step)" @changedData="loopUp" :ui="page.content" :json="json" :filledData="filledData"/>
      <b-button variant="primary" class="float-right" @click="next(index)" v-if="!page.hideNext">{{page.nextText || "Next"}}</b-button>
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
  methods: {
    next(index){
      if (document.getElementById(this.formID).reportValidity()) {
        this.step=this.steps[index+1];
        this.done[index] = true;
      }
    }
  },
  created() {
    this.step = this.steps[0];
  },
  mounted() {
   this.color = getComputedStyle(document.documentElement).getPropertyValue('--primary');
   this.errorColor = getComputedStyle(document.documentElement).getPropertyValue('--danger');
 },
  watch: {
    step: function (newValue){
      for (let i = this.steps.indexOf(newValue); i < this.done.length; i++) {
        this.done[i] = false;
      }
    }
  },
}
</script>

<style scoped>

</style>
