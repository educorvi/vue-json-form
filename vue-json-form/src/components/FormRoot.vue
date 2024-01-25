<template>
  <form @submit="onSubmitFormLocal" @reset="resetForm">
    <FormWrap :ui-schema="storedUiSchema"/>
  </form>
</template>

<script setup lang="ts">
  import {watch} from "vue";
  import {useFormDataStore} from "@/stores/formData";
  import {storeToRefs} from "pinia";
  import type {CoreSchemaMetaSchema} from "@/typings/json-schema";
  import type {UISchema} from "@/typings/ui-schema";
  import FormWrap from "@/components/FormWrap.vue";

  const {data, jsonSchema: storedJsonSchema, uiSchema: storedUiSchema} = storeToRefs(useFormDataStore());

  const props = defineProps<{
    /**
     * This function will be called when the form is submitted.
     * @param data The data of the form
     */
    onSubmitForm: (data: Record<string, any>) => void;

    /**
     * The JSON Schema of the form
     */
    jsonSchema: CoreSchemaMetaSchema;

    /**
     * The UI Schema of the form
     */
    uiSchema: UISchema;
  }>();

  function onSubmitFormLocal(evt: Event) {
    evt.preventDefault();
    props.onSubmitForm(data.value);
    return;
  }

  function resetForm(evt: Event) {
    evt.preventDefault();
    //TODO
    return;
  }


  watch(props, (newVal) => {
    storedJsonSchema.value = newVal.jsonSchema;
    storedUiSchema.value = newVal.uiSchema;
  })
</script>

<style scoped>

</style>