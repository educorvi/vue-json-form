<script setup lang="ts">
import json from '@/exampleSchemas/showcase/schema.json';
import ui from '@/exampleSchemas/showcase/ui.json';

import reproduceJson from '@/exampleSchemas/reproduce/schema.json';
import reproduceUi from '@/exampleSchemas/reproduce/ui.json';

import { bootstrapComponents } from '@/renderings/bootstrap/BootstrapComponents.ts';
import { AjvValidator } from '@educorvi/vue-json-form-ajv-validator';
import { IfThenElseMapper } from '@/Mappers';
import { VueJsonForm } from '@/main.ts';
</script>

<template>
    <h1>Multiple JsonForms</h1>
    <VueJsonForm
        id="showcase-form"
        :json-schema="json"
        :on-submit-form="async (...data: any) => console.log(data)"
        :render-interface="bootstrapComponents"
        :ui-schema="ui"
        :validator="AjvValidator"
        :mappers="[IfThenElseMapper]"
    >
    </VueJsonForm>
    <hr />
    <VueJsonForm
        id="reproduce-form"
        :json-schema="reproduceJson"
        :on-submit-form="async (...data: any) => console.log(data)"
        :render-interface="bootstrapComponents"
        :ui-schema="reproduceUi"
        :validator="AjvValidator"
        :mappers="[IfThenElseMapper]"
    >
    </VueJsonForm>
</template>

<style scoped></style>
