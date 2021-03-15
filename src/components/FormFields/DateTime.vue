<template>
  <div :name="title" :id="schemaName">
    <b-input v-model="time" style="border-bottom-left-radius: 0; border-bottom-right-radius: 0" type="time" :required="required"/>
    <b-input ref="child" v-model="date" type="date" style="border-top-left-radius: 0; border-top-right-radius: 0" :required="required"/>
  </div>
</template>

<script>
import formFieldMixin from "./formFieldMixin.js";

//@group FormFields
/**
 * This is used to render date-time-fields
 */
export default {
  name: "DateTime",
  mixins: [formFieldMixin],
  data() {
    return {
      date: null,
      time: null
    }
  },
  methods: {
    set() {
      this.fieldData = this.date + "T" + this.time;
    }
  },
  mounted() {
    if (this.fieldData) {
      const s = this.fieldData.split("T");
      this.date = s[0];
      this.time = s[1];
    }
  },
  watch: {
    date() {
      this.set();
    },
    time() {
      this.set();
    }
  },
}
</script>

<style scoped>

</style>
