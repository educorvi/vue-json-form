<script setup lang="ts">

import { VueJsonForm as vjfComp, bootstrapComponents } from '@educorvi/vue-json-form';
import { computed, type ComputedRef } from 'vue';

const props = defineProps<{
    /**
     * The JSON Schema of the form
     */
    jsonSchema: string

    /**
     * The UI Schema of the form
     */
    uiSchema?: string

    /**
     * The default data of the form
     */
    presetData?: string

    /**
     * Return data as key value pairs with the keys being the scopes as used in the ui schema and the values being the data
     */
    returnDataAsScopes?: boolean | string;
}>();

const data: ComputedRef = computed(() => {
    return {
        jsonSchema: JSON.parse(props.jsonSchema) as Record<string, any>,
        uiSchema: (props.uiSchema ? JSON.parse(props.uiSchema) : undefined) as Record<string, any> | undefined,
        presetData: (props.presetData ? JSON.parse(props.presetData) : undefined) as Record<string, any> | undefined,
        returnDataAsScopes: (props.returnDataAsScopes ? JSON.parse(props.returnDataAsScopes.toString()) : false) as boolean,
    };
});

</script>

<template>
        <vjf-comp :json-schema="data.jsonSchema" :ui-schema="data.uiSchema" :preset-data="data.presetData"
                  :return-data-as-scopes="data.returnDataAsScopes" :render-interface="bootstrapComponents"></vjf-comp>
</template>

<style lang="scss">
//@use "bootstrap/scss/bootstrap";
//@use "bootstrap/scss/variables";
@use 'sass:meta';
@use "bootstrap/scss/bootstrap";

@function is-map($value) {
    @if type-of($value) == 'map' {
        @return true;
    } @else {
        @return false;
    }
}


:host {
    @each $name, $value in meta.module-variables("bootstrap") {
        @if not is-map($value){
            --bs-#{$name}: #{$value};
        }
        //--#{$name}: #{type-of($value)};
    }
}

@import "@educorvi/vue-json-form/dist/vue-json-form.css";
</style>