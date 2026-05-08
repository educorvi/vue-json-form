<script setup lang="ts">
import { bootstrapComponents } from '@/renderings/bootstrap/BootstrapComponents.ts';
import { AjvValidator } from '@educorvi/vue-json-form-ajv-validator';
import { IfThenElseMapper } from '@/Mappers';
import { VueJsonForm } from '@/main.ts';

import { ref, computed, onMounted, type Ref } from 'vue';
import type { SubmitOptions } from '@educorvi/vue-json-form-schemas';
import { BAlert, BButton, BFormTextarea } from 'bootstrap-vue-next';

const SESSION_KEY_JSON = 'custom-schema-json';
const SESSION_KEY_UI = 'custom-schema-ui';

const jsonSchemaText = ref('');
const uiSchemaText = ref('');
const jsonError = ref('');
const uiError = ref('');
const formData: Ref<undefined | Record<string, any>> = ref(undefined);
const showForm = ref(false);

function loadFromSession() {
    const storedJson = sessionStorage.getItem(SESSION_KEY_JSON);
    const storedUi = sessionStorage.getItem(SESSION_KEY_UI);
    if (storedJson) {
        jsonSchemaText.value = storedJson;
    }
    if (storedUi) {
        uiSchemaText.value = storedUi;
    }
    if (storedJson && storedUi) {
        applySchemas();
    }
}

onMounted(() => {
    loadFromSession();
});

const parsedJsonSchema = ref<Record<string, any> | null>(null);
const parsedUiSchema = ref<Record<string, any> | null>(null);

function applySchemas() {
    jsonError.value = '';
    uiError.value = '';
    let valid = true;

    try {
        parsedJsonSchema.value = JSON.parse(jsonSchemaText.value);
    } catch {
        jsonError.value = 'Invalid JSON Schema: could not parse JSON.';
        valid = false;
    }

    try {
        parsedUiSchema.value = JSON.parse(uiSchemaText.value);
    } catch {
        uiError.value = 'Invalid UI Schema: could not parse JSON.';
        valid = false;
    }

    if (valid) {
        sessionStorage.setItem(SESSION_KEY_JSON, jsonSchemaText.value);
        sessionStorage.setItem(SESSION_KEY_UI, uiSchemaText.value);
        formData.value = undefined;
        showForm.value = true;
    } else {
        // Ensure no stale schemas or form are shown when parsing fails
        parsedJsonSchema.value = null;
        parsedUiSchema.value = null;
        formData.value = undefined;
        showForm.value = false;
    }
}

function resetSchemas() {
    sessionStorage.removeItem(SESSION_KEY_JSON);
    sessionStorage.removeItem(SESSION_KEY_UI);
    jsonSchemaText.value = '';
    uiSchemaText.value = '';
    parsedJsonSchema.value = null;
    parsedUiSchema.value = null;
    jsonError.value = '';
    uiError.value = '';
    formData.value = undefined;
    showForm.value = false;
}

function readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () =>
            reject(
                new Error(
                    `Could not read file: ${reader.error?.message ?? 'unknown error'}`
                )
            );
        reader.readAsText(file);
    });
}

async function onJsonFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
        jsonSchemaText.value = await readFile(file);
        jsonError.value = '';
    } catch {
        jsonError.value = 'Could not read the selected file.';
    }
}

async function onUiFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
        uiSchemaText.value = await readFile(file);
        uiError.value = '';
    } catch {
        uiError.value = 'Could not read the selected file.';
    }
}

const canApply = computed(
    () => jsonSchemaText.value.trim() !== '' && uiSchemaText.value.trim() !== ''
);

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

<template>
    <h2>Custom Schema</h2>
    <p class="text-muted">
        Upload or paste your JSON Schema and UI Schema below. The schemas are
        persisted in session storage and survive page reloads.
    </p>

    <div class="row">
        <div class="col-md-6">
            <h3>JSON Schema</h3>
            <div class="mb-3">
                <label class="form-label" for="json-file-input"
                    >Upload JSON Schema file</label
                >
                <input
                    id="json-file-input"
                    class="form-control"
                    type="file"
                    accept=".json,application/json"
                    @change="onJsonFileChange"
                />
            </div>
            <div class="mb-3">
                <label class="form-label" for="json-text-input"
                    >Or paste JSON Schema</label
                >
                <BFormTextarea
                    id="json-text-input"
                    v-model="jsonSchemaText"
                    rows="10"
                    spellcheck="false"
                    class="font-monospace"
                />
            </div>
            <BAlert v-if="jsonError" variant="danger" :model-value="true">{{
                jsonError
            }}</BAlert>
        </div>

        <div class="col-md-6">
            <h3>UI Schema</h3>
            <div class="mb-3">
                <label class="form-label" for="ui-file-input"
                    >Upload UI Schema file</label
                >
                <input
                    id="ui-file-input"
                    class="form-control"
                    type="file"
                    accept=".json,application/json"
                    @change="onUiFileChange"
                />
            </div>
            <div class="mb-3">
                <label class="form-label" for="ui-text-input"
                    >Or paste UI Schema</label
                >
                <BFormTextarea
                    id="ui-text-input"
                    v-model="uiSchemaText"
                    rows="10"
                    spellcheck="false"
                    class="font-monospace"
                />
            </div>
            <BAlert v-if="uiError" variant="danger" :model-value="true">{{
                uiError
            }}</BAlert>
        </div>
    </div>

    <div class="d-flex gap-2 mt-3 mb-4">
        <BButton variant="primary" :disabled="!canApply" @click="applySchemas">
            Apply &amp; Show Form
        </BButton>
        <BButton variant="outline-secondary" @click="resetSchemas">
            Reset
        </BButton>
    </div>

    <template v-if="showForm">
        <hr />
        <VueJsonForm
            id="custom-schema-form"
            :json-schema="parsedJsonSchema!"
            :on-submit-form="onSubmitForm"
            :render-interface="bootstrapComponents"
            :ui-schema="parsedUiSchema!"
            :validator="AjvValidator"
            :mappers="[IfThenElseMapper]"
        />
        <hr />
        <h3>Results</h3>
        <p class="text-muted">Press submit to update</p>
        <pre v-if="formData" id="result-container">{{
            JSON.stringify(formData, null, 2)
        }}</pre>
    </template>
</template>

<style scoped></style>
