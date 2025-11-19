<template>
    <VueJsonForm
        id="reproduce-form"
        :json-schema="json"
        :on-submit-form="onSubmitForm"
        :render-interface="bootstrapComponents"
        :ui-schema="ui"
        :presetData="presetData"
        :validator="AjvValidator"
        :mappers="[IfThenElseMapper]"
    >
    </VueJsonForm>
    <hr />
    <h2>Results</h2>
    <p class="text-muted">Press submit to update</p>
    <pre id="result-container">{{ JSON.stringify(formData, null, 2) }}</pre>
</template>

<script setup lang="ts">
import {
    EnglishLanguageProvider,
    type SubmitOptions,
    VueJsonForm,
} from '../main';

import json from '../exampleSchemas/reproduce/schema.json';
import ui from '../exampleSchemas/reproduce/ui.json';
import { bootstrapComponents } from '@/renderings/bootstrap/BootstrapComponents';
import 'bootstrap-icons/font/bootstrap-icons.min.css';

import { markRaw, nextTick, ref, type Ref, watch } from 'vue';
import { AjvValidator } from '@educorvi/vue-json-form-ajv-validator';
import { IfThenElseMapper } from '@/Mappers';

const presetData: Ref<Record<string, any> | undefined> = ref({
    'jso-39-multiselect': ['option 2', 'option 3'],
    'jso-39-string': 'Test',
    'jso-39-array': ['Hello', 'World'],
    'jso-39-object': {
        test: 'ABC',
        number: 14,
    },
    arrInArrPres: [
        ['item1', 'item2'],
        ['item3', 'item4'],
    ],
});

const formData = ref({});

async function onSubmitForm(data: Record<string, any>, options: SubmitOptions) {
    formData.value = data;
    switch (options.action) {
        case 'console':
            console.log(data);
            break;
        case 'sleep':
            await new Promise((r) => setTimeout(r, 2000));
            break;
        default:
            break;
    }
}
</script>

<style scoped></style>
