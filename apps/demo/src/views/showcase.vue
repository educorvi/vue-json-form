<script setup lang="ts">
import { ref } from 'vue';
import { bootstrapComponents, VueJsonForm } from '@educorvi/vue-json-form';
import showcaseSchema from '@educorvi/vue-json-form/src/exampleSchemas/showcase/schema.json';
import showcaseUISchema from '@educorvi/vue-json-form/src/exampleSchemas/showcase/ui.json';
import { BButton, BButtonGroup, BFormCheckbox } from 'bootstrap-vue-next';

const emit = defineEmits<{
    viewCode: [title: string, object: Record<any, any>];
}>();

async function submitMethod(data: Record<string, any>) {
    emit('viewCode', 'Form Results', data);
}

const submitAsScopes = ref(false);
</script>

<template>
    <h1>Showcase form</h1>
    The following form gives an overview of the features of Vue JSON Form.
    <div class="mt-3 mb-3">
        <b-form-checkbox v-model="submitAsScopes"
            >Submit as scopes</b-form-checkbox
        >
    </div>
    <b-button-group class="w-100">
        <b-button
            variant="outline-primary"
            @click="emit('viewCode', 'JSON Schema', showcaseSchema)"
            >Show JSON Schema
        </b-button>
        <b-button
            variant="outline-primary"
            @click="emit('viewCode', 'UI Schema', showcaseUISchema)"
            >Show UI Schema
        </b-button>
    </b-button-group>
    <hr />
    <vue-json-form
        :json-schema="showcaseSchema"
        :ui-schema="showcaseUISchema"
        :return-data-as-scopes="submitAsScopes"
        :on-submit-form="submitMethod"
        :render-interface="bootstrapComponents"
    ></vue-json-form>
</template>

<style scoped></style>
