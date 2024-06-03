<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { VueJsonForm } from '@educorvi/vue-json-form';
import { BButton, BButtonGroup, BForm, BFormCheckbox, BFormFile, BInput } from 'bootstrap-vue-next';
import { oneOfToEnum } from '@educorvi/vue-json-form';

const emit = defineEmits<{
    viewCode: [title: string, object: Record<any, any>];
}>();

function submitMethod(data: Record<string, any>) {
    emit("viewCode", "Form Results", data);
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

const submitAsScopes = ref(false);
const submitButton = ref(false);

const rawJsonSchema = ref(undefined as File | undefined);
const rawUiSchema = ref(undefined as File | undefined);

const jsonSchema = ref(undefined as Record<string, any> | undefined);
const uiSchema = ref(undefined as Record<string, any> | undefined);
</script>

<template>
    <h1>Custom form</h1>
    Upload and display your own form here.
    <div class="mt-3 mb-3">
        <b-form-checkbox v-model="submitAsScopes">Submit as scopes</b-form-checkbox>
        <b-form-checkbox v-model="submitButton">Add submit button</b-form-checkbox>
    </div>
    <b-form @submit="loadSchemas">
        <label for="json-schema">Upload JSON Schema</label>
        <b-form-file id="json-schema" v-model="rawJsonSchema" required></b-form-file>
        <label for="json-schema" class="mt-2">Upload UI Schema (Optional)</label>
        <b-form-file id="json-schema" v-model="rawUiSchema"></b-form-file>

        <b-button-group class="mt-3 w-100">
            <b-button type="submit"  variant="primary">Load Schemas</b-button>
            <b-button type="reset" @click="() => {jsonSchema = undefined; uiSchema = undefined}">Clear</b-button>
        </b-button-group>

    </b-form>
    <hr>
    <vue-json-form v-if="jsonSchema" :jsonSchema="jsonSchema" :uiSchema="uiSchema"
                   :returnDataAsScopes="submitAsScopes" :onSubmitForm="submitMethod"
                    :mapperFunctions="[oneOfToEnum]">
        <b-button v-if="submitButton" type="submit" class="mt-3 w-100" variant="primary">Submit</b-button>
    </vue-json-form>
    <div v-else>
        <p class="text-muted">Load at least a JSON Schema to display a form</p>
    </div>
</template>

<style scoped>

</style>