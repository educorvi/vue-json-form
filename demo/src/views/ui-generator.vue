<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { VueJsonForm, generateUISchema } from '@educorvi/vue-json-form';
import { BButton, BButtonGroup, BCard, BForm, BFormCheckbox, BFormFile, BInput } from 'bootstrap-vue-next';
import VueJsonPretty from 'vue-json-pretty';

const emit = defineEmits<{
    viewCode: [title: string, object: Record<any, any>];
}>();

function download() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(
        new Blob([JSON.stringify(uiSchema.value, null, 2)], { type: 'application/json' }),
    );
    a.download = 'ui-schema.json';
    a.click();
}

const rawJsonSchema = ref(undefined as File | undefined);

const jsonSchema = ref(undefined as Record<string, any> | undefined);
const uiSchema = ref(undefined as Record<string, any> | undefined);

async function generate(evt: Event) {
    evt.preventDefault();

    const json = await rawJsonSchema.value?.text();
    if (!json) {
        throw new Error('Error reading JSON schema');
    }
    jsonSchema.value = JSON.parse(json);
    if (!jsonSchema.value) {
        throw new Error('Error parsing JSON schema');
    }
    uiSchema.value = generateUISchema(jsonSchema.value);
}
</script>

<template>
    <h1>UI Generator</h1>
    Generate an example UI Schema for your form.
    <b-form @submit="generate" class="mt-2">
        <label for="json-schema">Upload JSON Schema</label>
        <b-form-file id="json-schema" v-model="rawJsonSchema" required></b-form-file>

        <b-button-group class="mt-3 w-100">
            <b-button type="submit" variant="primary">Generate UI Schema</b-button>
            <b-button type="reset" @click="() => {jsonSchema = undefined; uiSchema = undefined}">Clear</b-button>
        </b-button-group>

    </b-form>
    <hr>
    <div v-if="uiSchema">
        <b-button variant="outline-primary" class="w-100 mb-3" @click="download">Download</b-button>
        <b-card>
            <vue-json-pretty :data="uiSchema" />
        </b-card>
    </div>
</template>

<style scoped>

</style>