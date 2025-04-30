<script setup lang="ts">
import {
  VueJsonForm as vjfComp,
} from "@educorvi/vue-json-form";
import { computed, type ComputedRef } from "vue";
import { oneOfToEnum } from "@educorvi/vue-json-form/src/MapperFunctions/oneOfToEnum";
import type { MapperFunction } from "@educorvi/vue-json-form/src/typings/customTypes";
import type { SubmitOptions } from '@educorvi/vue-json-form/src/typings/ui-schema';
import axios from 'axios';

const props = defineProps<{
  /**
   * The JSON Schema of the form
   */
  jsonSchema: string;

  /**
   * The UI Schema of the form
   */
  uiSchema?: string;

  /**
   * The plain data of the form
   */
  presetData?: string;

  /**
   * Return data as key value pairs with the keys being the scopes as used in the ui schema and the values being the data
   */
  returnDataAsScopes?: boolean | string;
}>();

const emit = defineEmits<{
  (e: 'submit', data: Record<string, any>, options: SubmitOptions): void;
}>();

const data: ComputedRef = computed(() => {
  return {
    jsonSchema: JSON.parse(props.jsonSchema) as Record<string, any>,
    uiSchema: (props.uiSchema ? JSON.parse(props.uiSchema) : undefined) as
      | Record<string, any>
      | undefined,
    presetData: (props.presetData
      ? JSON.parse(props.presetData)
      : undefined) as Record<string, any> | undefined,
    returnDataAsScopes: (props.returnDataAsScopes
      ? JSON.parse(props.returnDataAsScopes.toString())
      : false) as boolean,
  };
});

const mapperFunctions: MapperFunction[] = [oneOfToEnum];

async function onSubmitForm(data: Record<string, any>, options: SubmitOptions) {
    if (options.action === 'request' && options.requestUrl) {
        await axios.post(options.requestUrl);
    } else {
        emit('submit', data, options);
    }
}
</script>

<template>
  <vjf-comp
    :json-schema="data.jsonSchema"
    :ui-schema="data.uiSchema"
    :preset-data="data.presetData"
    :return-data-as-scopes="data.returnDataAsScopes"
    :mapper-functions="mapperFunctions"
    :onSubmitForm="onSubmitForm"
  ></vjf-comp>
</template>
