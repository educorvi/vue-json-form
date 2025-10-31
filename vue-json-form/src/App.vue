<template>
    <main>
        <div style="display: flex; justify-content: center">
            <div style="max-width: 700px; margin: 20px; width: 100%">
                <h1>Vue JSON Form Demo</h1>
                <b-form-checkbox switch v-model="reproduce">
                    Reproduce form
                </b-form-checkbox>
                <VueJsonForm
                    v-if="jsonSchema"
                    :json-schema="jsonSchema"
                    :on-submit-form="onSubmitForm"
                    :render-interface="bootstrapComponents"
                    :ui-schema="uiSchema || {}"
                    :presetData="presetData"
                    :validator="AjvValidator"
                    :mapper-functions="[debugMapper]"
                >
                </VueJsonForm>
                <hr />
                <h2>Results</h2>
                <p class="text-muted">Press submit to update</p>
                <pre id="result-container">{{
                    JSON.stringify(formData, null, 2)
                }}</pre>
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
import {
    EnglishLanguageProvider,
    type SubmitOptions,
    VueJsonForm,
} from './main';
import json from './exampleSchemas/showcase/schema.json';
import ui from './exampleSchemas/showcase/ui.json';

import json_repro from './exampleSchemas/reproduce/schema.json';
import ui_repro from './exampleSchemas/reproduce/ui.json';
import { bootstrapComponents } from '@/renderings/bootstrap/BootstrapComponents';
import 'bootstrap-icons/font/bootstrap-icons.min.css';

import { markRaw, nextTick, ref, type Ref, watch } from 'vue';
import { BFormCheckbox } from 'bootstrap-vue-next';
import { AjvValidator } from '@educorvi/vue-json-form-ajv-validator';
import { debugMapper } from '@/MapperFunctions/debugMapper.ts';

const reproduce: Ref<boolean> = ref(
    localStorage.getItem('reproduce') === 'true'
);
const jsonSchema: Ref<Record<string, any> | null> = ref(null);
const uiSchema: Ref<Record<string, any> | null> = ref(null);
const presetData: Ref<Record<string, any> | undefined> = ref(undefined);

const formData = ref({});

const searchParams = new URLSearchParams(window.location.search);

switch (searchParams.get('variant')) {
    case 'reproduce':
        reproduce.value = true;
        break;
    case 'showcase':
        reproduce.value = false;
        break;
    default:
        // leave as is
        break;
}

async function setSchema(reproduce_val: boolean) {
    jsonSchema.value = null;
    await nextTick();
    if (reproduce_val) {
        presetData.value = {
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
        };
        jsonSchema.value = json_repro;
        uiSchema.value = ui_repro;
    } else {
        presetData.value = undefined;
        jsonSchema.value = json;
        uiSchema.value = ui;
    }
}

setSchema(reproduce.value);

watch(reproduce, async (value) => {
    localStorage.setItem('reproduce', value.toString());
    await setSchema(value);
});

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
