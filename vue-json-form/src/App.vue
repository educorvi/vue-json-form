<template>
    <div style="display: flex; justify-content: center">
        <div style="max-width: 700px; margin: 20px">
            <h1>Vue JSON Form Demo</h1>
            <FormRoot
                :json-schema="jsonSchema"
                :on-submit-form="console.log"
                :ui-schema="uiSchema"
                :render-interface="components"
            >
            </FormRoot>
        </div>
    </div>
</template>

<script setup lang="ts">
import FormRoot from '@/components/FormRoot.vue';
import json from './exampleSchemas/showcase/schema.json';
import ui from './exampleSchemas/showcase/ui.json';
import { bootstrapComponents } from '@/renderings/bootstrap/BootstrapComponents';
import type { CoreSchemaMetaSchema } from '@/typings/json-schema';
import type { UISchema } from '@/typings/ui-schema';
import { markRaw, shallowRef } from 'vue';

const components = markRaw(bootstrapComponents);

const jsonSchema = json;
const uiSchema = ui;
</script>

<style scoped></style>
