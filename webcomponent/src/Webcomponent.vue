<script setup lang="ts">
import {VueJsonForm as vjfComp} from "@educorvi/vue-json-form"

defineProps<{
   /**
     * The JSON Schema of the form
     */
    jsonSchema: Record<string, any>;

    /**
     * The UI Schema of the form
     */
    uiSchema?: Record<string, any>;

    /**
     * The default data of the form
     */
    presetData?: Record<string, any>;

    /**
     * Return data as key value pairs with the keys being the scopes as used in the ui schema and the values being the data
     */
    returnDataAsScopes?: boolean;
}>();
</script>

<template>
<vjf-comp :json-schema="jsonSchema" :ui-schema="uiSchema" :preset-data="presetData" :return-data-as-scopes="returnDataAsScopes"></vjf-comp>
</template>

<style scoped lang="scss">
@import "@educorvi/vue-json-form/dist/vue-json-form.css";
</style>