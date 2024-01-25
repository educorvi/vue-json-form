<template>
<h1>Vue JSON Form Demo</h1>
  <FormRoot :json-schema="<CoreSchemaMetaSchema><unknown>json" :on-submit-form="console.log" :ui-schema="<UISchema>ui">

  </FormRoot>
</template>

<script setup lang="ts">

import FormRoot from "@/components/FormRoot.vue";
import json from "./exampleSchemas/showcase/schema.json";
import ui from "./exampleSchemas/showcase/ui.json";

import type {CoreSchemaMetaSchema} from "@/typings/json-schema";
import type {UISchema} from "@/typings/ui-schema";


</script>

<style scoped>

</style>
