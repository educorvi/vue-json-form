<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { type SubmitOptions, VueJsonForm } from '@educorvi/vue-json-form';
import { oneOfToEnum } from '@educorvi/vue-json-form';
import { AjvValidator } from '@educorvi/vue-json-form-ajv-validator';

const emit = defineEmits<{
    viewCode: [title: string, object: Record<any, any>];
}>();

async function submitMethod(data: Record<string, any>, customSubmitOptions: SubmitOptions, evt: SubmitEvent) {
    emit('viewCode', 'Form Results', data);
}

async function loadSchemas(evt: Event) {
    evt.preventDefault();
    jsonSchema.value = undefined;
    uiSchema.value = undefined;

    await nextTick();

    const json = await rawJsonSchema.value?.text();
    const ui = await rawUiSchema.value?.text();
    if (!json) {
        throw new Error('Error reading JSON schema');
    }
    jsonSchema.value = JSON.parse(json);
    if (ui) {
        uiSchema.value = JSON.parse(ui);
    }
}

async function loadSchemasFromInput(evt: Event) {
    evt.preventDefault();
    jsonSchema.value = undefined;
    uiSchema.value = undefined;

    await nextTick();
    if (!rawJsonSchemaInput.value) {
        throw new Error('Error reading JSON schema');
    }
    jsonSchema.value = JSON.parse(rawJsonSchemaInput.value);
    if (rawUiSchemaInput.value) {
        uiSchema.value = JSON.parse(rawUiSchemaInput.value);
    }
}

const submitAsScopes = ref(false);
const submitButton = ref(false);

const rawJsonSchema = ref(undefined as File | undefined);
const rawUiSchema = ref(undefined as File | undefined);

const rawJsonSchemaInput = ref(undefined as string | undefined);
const rawUiSchemaInput = ref(undefined as string | undefined);

const jsonSchema = ref(undefined as Record<string, any> | undefined);
const uiSchema = ref(undefined as Record<string, any> | undefined);

function clear() {
    rawJsonSchema.value = undefined;
    rawUiSchema.value = undefined;

    rawJsonSchemaInput.value = undefined;
    rawUiSchemaInput.value = undefined;

    jsonSchema.value = undefined;
    uiSchema.value = undefined;
}
</script>

<template>
    <h1>Custom form</h1>
    Upload and display your own form here.
    <div class="mt-3 mb-3">
        <b-form-checkbox v-model="submitAsScopes">Submit as scopes</b-form-checkbox>
        <b-form-checkbox v-model="submitButton">Add submit button</b-form-checkbox>
    </div>
    <BCard no-body>
        <BTabs card>
            <BTab title="Input">
                <b-form @submit="loadSchemasFromInput">
                    <label for="json-schema">JSON Schema</label>
                    <b-form-textarea id="json-schema" v-model="rawJsonSchemaInput" required rows="12"></b-form-textarea>
                    <label for="json-schema" class="mt-2">UI Schema (Optional)</label>
                    <b-form-textarea id="json-schema" v-model="rawUiSchemaInput" rows="12"></b-form-textarea>

                    <b-button-group class="mt-3 w-100">
                        <b-button type="submit" variant="primary">Load Schemas</b-button>
                        <b-button type="reset" @click="clear">Clear</b-button>
                    </b-button-group>
                </b-form>
            </BTab>
            <BTab title="Upload">
                <b-form @submit="loadSchemas">
                    <label for="json-schema">Upload JSON Schema</label>
                    <b-form-file id="json-schema" v-model="rawJsonSchema" required></b-form-file>
                    <label for="json-schema" class="mt-2">Upload UI Schema (Optional)</label>
                    <b-form-file id="json-schema" v-model="rawUiSchema"></b-form-file>

                    <b-button-group class="mt-3 w-100">
                        <b-button type="submit" variant="primary">Load Schemas</b-button>
                        <b-button type="reset" @click="clear">Clear</b-button>
                    </b-button-group>
                </b-form>
            </BTab>
        </BTabs>
    </BCard>
    <hr>
    <vue-json-form v-if="jsonSchema" :jsonSchema="jsonSchema" :uiSchema="uiSchema"
                   :returnDataAsScopes="submitAsScopes" :onSubmitForm="submitMethod"
                   :mapperFunctions="[oneOfToEnum]" :validator="AjvValidator">
        <b-button v-if="submitButton" type="submit" class="mt-3 w-100" variant="primary">Submit</b-button>
    </vue-json-form>
    <div v-else>
        <p class="text-muted">Load at least a JSON Schema to display a form</p>
    </div>
</template>

<style scoped>

</style>
