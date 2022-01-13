<template>
  <b-form-file :id="schemaName" v-model="files" :required="required" :placeholder="getUIOption('placeholder')"
               :drop-placeholder="getUIOption('drop-placeholder')" :multiple="getUIOption('allowMultipleFiles')"
               :accept="getUIOption('acceptedFileType')" class="vjf_file"/>
</template>

<script>
import formFieldMixin from "./formFieldMixin";
//@group FormFields
export default {
  name: "File",
  mixins: [formFieldMixin],
  data() {
    return {
      files: []
    }
  },
  watch: {
    files(newValue) {
      if (newValue === null || newValue === undefined) {
        this.fieldData = null;
      }
      let cont = this;

      //Convert File to base64
      function getBase64(file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () {
          if (Array.isArray(newValue)) {
            cont.fieldData.push(reader.result);
          } else {
            cont.fieldData = reader.result;
          }
        };
        reader.onerror = function (error) {
          console.error('Error: ', error);
        };
      }


      if (Array.isArray(newValue)) {
        this.fieldData = [];
        for (const file of newValue) {
          getBase64(file);
        }
      } else {
        getBase64(newValue);
      }
    }
  },
}
</script>

<style scoped>

</style>
