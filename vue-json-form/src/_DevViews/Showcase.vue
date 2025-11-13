<script setup lang="ts">
import { bootstrapComponents } from '@/renderings/bootstrap/BootstrapComponents.ts';
import { AjvValidator } from '@educorvi/vue-json-form-ajv-validator';
import { IfThenElseMapper } from '@/Mappers';
import { VueJsonForm } from '@/main.ts';

import json from '../exampleSchemas/showcase/schema.json';
import ui from '../exampleSchemas/showcase/ui.json';

import { nextTick, ref, type Ref, watch } from 'vue';
import type { SubmitOptions } from '@educorvi/vue-json-form-schemas';

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
    <div style="display: flex; justify-content: center">
        <div style="max-width: 700px; margin: 20px; width: 100%">
            <VueJsonForm
                :json-schema="json"
                :on-submit-form="onSubmitForm"
                :render-interface="bootstrapComponents"
                :ui-schema="ui"
                :validator="AjvValidator"
                :mappers="[IfThenElseMapper]"
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
</template>

<style scoped></style>
