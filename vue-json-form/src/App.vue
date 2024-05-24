<template>
    <div style="display: flex; justify-content: center">
        <div style="max-width: 700px; margin: 20px; width: 100%">
            <h1>Vue JSON Form Demo</h1>
            <VueJsonForm
                :json-schema="jsonSchema"
                :on-submit-form="console.log"
                :render-interface="bootstrapComponents"
                :ui-schema="uiSchema"
            >
            </VueJsonForm>
        </div>
    </div>
</template>

<script setup lang="ts">
import { VueJsonForm } from './main';
import json from './exampleSchemas/showcase/schema.json';
import ui from './exampleSchemas/showcase/ui.json';
import { bootstrapComponents } from '@/renderings/bootstrap/BootstrapComponents';
import type { CoreSchemaMetaSchema } from '@/typings/json-schema';
import type { UISchema } from '@/typings/ui-schema';
import { markRaw, shallowRef } from 'vue';
import { BButton, BFormInput } from 'bootstrap-vue-next';

const components = markRaw(bootstrapComponents);

const jsonSchema = json;
const uiSchema = ui;
</script>

<style scoped></style>
