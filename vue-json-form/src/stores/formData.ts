import {defineStore} from "pinia";
import type {Ref} from "vue";
import {ref} from "vue";
import type {UISchema} from "@/typings/ui-schema";
import type {CoreSchemaMetaSchema} from "@/typings/json-schema";

export const useFormDataStore = defineStore('formData', () => {
const data: Ref<Record<string, any>> = ref({})

  const jsonSchema: Ref<CoreSchemaMetaSchema | null> = ref(null)
  const uiSchema: Ref<UISchema | null> = ref(null)

  return {data, jsonSchema, uiSchema}
})