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
import { VueJsonForm } from './main';
import json from './exampleSchemas/showcase/schema.json';
import ui from './exampleSchemas/showcase/ui.json';

import json_repro from './exampleSchemas/reproduce/schema.json';
import ui_repro from './exampleSchemas/reproduce/ui.json';
import { bootstrapComponents } from '@/renderings/bootstrap/BootstrapComponents';
import type { CoreSchemaMetaSchema } from '@/typings/json-schema';
import type { UISchema } from '@/typings/ui-schema';
import { computed, markRaw, nextTick, Ref, ref, shallowRef, watch } from 'vue';
import { BButton, BFormCheckbox, BFormInput } from 'bootstrap-vue-next';

const components = markRaw(bootstrapComponents);
const reproduce: Ref<boolean> = ref(
    localStorage.getItem('reproduce') === 'true'
);
const jsonSchema: Ref<Record<string, any> | null> = ref(null);
const uiSchema: Ref<Record<string, any> | null> = ref(null);

const formData = ref({});

const searchParams = new URLSearchParams(window.location.search);

if (searchParams.get('variant') === 'reproduce') {
    reproduce.value = true;
}

async function setSchema(reproduce_val: boolean) {
    if (reproduce_val) {
        jsonSchema.value = json_repro;
        uiSchema.value = ui_repro;
    } else {
        jsonSchema.value = json;
        uiSchema.value = ui;
    }
}

setSchema(reproduce.value);

watch(reproduce, async (value) => {
    localStorage.setItem('reproduce', value.toString());
    await setSchema(value);
});

function onSubmitForm(data: any) {
    formData.value = data;
    console.log(data);
}

// const jsonSchema = json;
// const uiSchema = ui;
// const jsonSchema = json_repro;
// const uiSchema = ui_repro;
</script>

<style scoped></style>
