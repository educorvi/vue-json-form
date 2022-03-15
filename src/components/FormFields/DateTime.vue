<template>
  <div>
    <b-input-group :name="title" :id="schemaName">
      <b-input ref="child" v-model="date" type="date" :required="required"/>
      <b-input-group-append>
        <b-input v-model="time" style="border-bottom-left-radius: 0; border-top-left-radius: 0" type="time"
                 :required="required"/>
      </b-input-group-append>
    </b-input-group>
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
      if (this.fieldData === "$now") {
        const now = new Date();
        this.fieldData = now.toISOString();
        this.date = this.fieldData.split("T")[0];
        this.time = `${this.padToTwoDigits(now.getHours())}:${this.padToTwoDigits(now.getMinutes())}`;
      } else {
        const s = this.fieldData.split("T");
        this.date = s[0];
        this.time = s[1];
      }
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
