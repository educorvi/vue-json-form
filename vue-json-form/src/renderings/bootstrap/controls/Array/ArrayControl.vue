<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { computedLabel, injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { generateUUID, mapUUID } from '@/Commons';
import { BButton } from 'bootstrap-vue-next';
import { getComponent, useFormStructureStore } from '@/stores/formStructure';
import { ref } from 'vue';

const ErrorViewer = getComponent('ErrorViewer');

const { formData, tempKey } = storeToRefs(useFormDataStore());
const { jsonSchema } = storeToRefs(useFormStructureStore());

const temp_refs = ref([] as string[]);

function addField() {
    const id = generateUUID();
    if (!jsonSchema.value) {
        throw new Error('jsonSchema is not defined were it should be');
    }
    let tempVals = jsonSchema.value[tempKey.value];
    if (!tempVals || !tempVals) {
        jsonSchema.value[tempKey.value] = {};
    }
    //TODO
}

const { layoutElement, jsonElement } = injectJsonData();
const id = controlID(layoutElement);
</script>

<template>
    <fieldset>
        <legend>{{ computedLabel(layoutElement).value }}</legend>
        <div
            class="vjf_array"
            v-if="typeof jsonElement.items === 'object' && 'type' in jsonElement.items"
            :id="id"
        >
            <div v-for="ref of temp_refs" :key="ref">
                {{ ref }}
            </div>
            <b-button variant="primary" class="w-100" @click="addField">+</b-button>
        </div>
        <error-viewer v-else header="Error" :id="id">
            The type of the array's items is missing in the schema
        </error-viewer>
    </fieldset>
</template>

<style scoped></style>
