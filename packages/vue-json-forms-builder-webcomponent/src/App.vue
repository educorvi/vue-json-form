<script setup lang="ts">
import { VueJsonFormBuilder } from '@educorvi/vue-json-form-builder';
import '@educorvi/vue-json-form-builder/dist/vue-json-form-builder.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import exampleJSON from '@educorvi/vue-json-form/src/exampleSchemas/showcase/schema.json';
import exampleUI from '@educorvi/vue-json-form/src/exampleSchemas/showcase/ui.json';
</script>

<template>
    <vue-json-form-builder
        :json-schema="JSON.stringify(exampleJSON)"
        :ui-schema="JSON.stringify(exampleUI)"
    ></vue-json-form-builder>
</template>

<style scoped></style>
