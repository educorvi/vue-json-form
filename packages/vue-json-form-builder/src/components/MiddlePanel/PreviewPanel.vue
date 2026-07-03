<script setup lang="ts">
import { useFormStore } from '@/stores/formStore';
import { VueJsonForm, bootstrapComponents } from '@educorvi/vue-json-form';
import { AjvValidator } from '@educorvi/vue-json-form-ajv-validator';

const store = useFormStore();

async function handleSubmit(data: Record<string, unknown>) {
    console.log('Preview form submitted:', data);
}
</script>

<template>
    <div class="rounded-3 bg-body shadow-sm border p-4 vjf-preview">
        <div
            v-if="store.formIsEmpty"
            class="d-flex flex-column align-items-center justify-content-center py-5 text-body"
        >
            <i
                class="bi bi-pencil-square d-block mb-2"
                style="font-size: 2rem"
            />
            <p class="small fw-medium">Add some fields to preview the form</p>
        </div>
        <vue-json-form
            v-else
            :json-schema="store.exportedJsonSchema as any"
            :ui-schema="store.uiSchema as any"
            :on-submit-form="handleSubmit"
            :render-interface="bootstrapComponents"
            :validator="AjvValidator"
        />
    </div>
</template>
