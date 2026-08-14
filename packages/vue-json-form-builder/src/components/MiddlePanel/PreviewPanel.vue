<script setup lang="ts">
import { computed } from 'vue';
import { PhPencilSimple } from '@phosphor-icons/vue';
import { VueJsonForm, bootstrapComponents } from '@educorvi/vue-json-form';
import { AjvValidator } from '@educorvi/vue-json-form-ajv-validator';
import { useFormBuilder } from '../../useFormBuilder';

const builder = useFormBuilder();

const schemas = computed(() => builder.generateSchemas());
const formIsEmpty = computed(() => {
    const def = builder.toJSON() as {
        root?: { children?: unknown[] };
        elements?: Record<string, unknown>;
    } | null;
    return (
        !def ||
        ((def.root?.children?.length ?? 0) === 0 &&
            Object.keys(def.elements ?? {}).length === 0)
    );
});

async function handleSubmit(data: Record<string, unknown>) {
    console.log('Preview form submitted:', data);
}
</script>

<template>
    <div class="rounded-3 bg-body shadow-sm border p-4 vjf-preview">
        <div
            v-if="formIsEmpty"
            class="d-flex flex-column align-items-center justify-content-center py-5 text-body"
        >
            <PhPencilSimple :size="32" weight="bold" class="d-block mb-2" />
            <p class="small fw-medium">Add some fields to preview the form</p>
        </div>
        <vue-json-form
            v-else
            :key="
                schemas
                    ? JSON.stringify(schemas.jsonSchema) +
                      JSON.stringify(schemas.uiSchema)
                    : 'empty'
            "
            :json-schema="
                (schemas?.jsonSchema as Record<string, unknown>) ?? {}
            "
            :ui-schema="
                (schemas?.uiSchema as Record<string, unknown>) ?? {
                    version: '2.0',
                    layout: { type: 'VerticalLayout', elements: [] },
                }
            "
            :on-submit-form="handleSubmit"
            :render-interface="bootstrapComponents"
            :validator="AjvValidator"
        />
    </div>
</template>
