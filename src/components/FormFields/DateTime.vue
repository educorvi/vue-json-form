<template>
  <div>
    <b-input-group :name="title">
      <b-input ref="child" v-model="date" type="date"/>
      <b-input-group-append>
        <b-input v-model="time" style="border-bottom-left-radius: 0; border-top-left-radius: 0" type="time"/>
      </b-input-group-append>
    </b-input-group>
  </div>
</template>

<script>
import formFieldMixin from "./formFieldMixin.js";

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
