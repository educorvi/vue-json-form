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
import { type SubmitOptions, VueJsonForm } from './main';
import json from './exampleSchemas/showcase/schema.json';
import ui from './exampleSchemas/showcase/ui.json';

import json_repro from './exampleSchemas/reproduce/schema.json';
import ui_repro from './exampleSchemas/reproduce/ui.json';
import { bootstrapComponents } from '@/renderings/bootstrap/BootstrapComponents';
import {
    AjvValidator,
    type CoreSchemaMetaSchema,
} from '@educorvi/vue-json-form-schemas';
import type { UISchema } from '@educorvi/vue-json-form-schemas';
import {
    computed,
    markRaw,
    nextTick,
    ref,
    type Ref,
    shallowRef,
    watch,
} from 'vue';
import { BButton, BFormCheckbox, BFormInput } from 'bootstrap-vue-next';

const components = markRaw(bootstrapComponents);
const reproduce: Ref<boolean> = ref(
    localStorage.getItem('reproduce') === 'true'
);
const jsonSchema: Ref<Record<string, any> | null> = ref(null);
const uiSchema: Ref<Record<string, any> | null> = ref(null);
const presetData: Ref<Record<string, any> | undefined> = ref(undefined);

const formData = ref({});

const searchParams = new URLSearchParams(window.location.search);

if (searchParams.get('variant') === 'reproduce') {
    reproduce.value = true;
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

// const jsonSchema = json;
// const uiSchema = ui;
// const jsonSchema = json_repro;
// const uiSchema = ui_repro;
</script>

<style scoped></style>
