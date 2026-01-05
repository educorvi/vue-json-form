<script setup lang="ts">
import { bootstrapComponents, IfThenElseMapper, VueJsonForm } from '../main';
import jsonSchema from '../exampleSchemas/wizard/schema.json';
import uiSchema from '../exampleSchemas/wizard/ui.json';
import { ref } from 'vue';
import type { SubmitOptions } from '@educorvi/vue-json-form-schemas';
import { AjvValidator } from '@educorvi/vue-json-form-ajv-validator';

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

<template>
    <vue-json-form
        :json-schema="jsonSchema"
        :ui-schema="uiSchema"
        :on-submit-form="onSubmitForm"
        :validator="AjvValidator"
        :mappers="[IfThenElseMapper]"
        :render-interface="bootstrapComponents"
    />
    <hr />
    <h2>Results</h2>
    <p class="text-muted">Press submit to update</p>
    <pre id="result-container">{{ JSON.stringify(formData, null, 2) }}</pre>
</template>

<style scoped></style>
