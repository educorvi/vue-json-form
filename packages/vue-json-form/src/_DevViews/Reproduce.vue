<template>
    <VueJsonForm
        id="reproduce-form"
        :json-schema="json"
        :on-submit-form="onSubmitForm"
        :render-interface="bootstrapComponents"
        :ui-schema="ui"
        :preset-data="presetData"
        :validator="AjvValidator"
        :mappers="[
            IfThenElseMapper,
            RitaDependentOptionsMapper,
            DependentRequiredMapper,
        ]"
    >
    </VueJsonForm>
    <hr />
    <h2>Results</h2>
    <p class="text-muted">Press submit to update</p>
    <pre v-if="formData" id="result-container">{{
        JSON.stringify(formData, null, 2)
    }}</pre>
</template>

<script setup lang="ts">
import {
    RitaDependentOptionsMapper,
    type SubmitOptions,
    VueJsonForm,
} from '../main';
import { presetData } from './presetDataForReproduce.ts';

import json from '../exampleSchemas/reproduce/schema.json';
import ui from '../exampleSchemas/reproduce/ui.json';
import { bootstrapComponents } from '@/renderings/bootstrap/BootstrapComponents';
import 'bootstrap-icons/font/bootstrap-icons.min.css';

import { ref, type Ref } from 'vue';
import { AjvValidator } from '@educorvi/vue-json-form-ajv-validator';
import { IfThenElseMapper } from '@/Mappers';
import { DependentRequiredMapper } from '@/Mappers/dependentRequiredMapper.ts';

const formData: Ref<undefined | Record<string, any>> = ref(undefined);

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
