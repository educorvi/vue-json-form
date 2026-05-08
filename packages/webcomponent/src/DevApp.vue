<script setup lang="ts">
import { ref, computed } from 'vue';

import summarySchema from './exampleSchemas/summary/schema.json';
import summaryUi from './exampleSchemas/summary/ui.json';
import showcaseSchema from '../../vue-json-form/src/exampleSchemas/showcase/schema.json';
import showcaseUi from '../../vue-json-form/src/exampleSchemas/showcase/ui.json';
import wizardSchema from '../../vue-json-form/src/exampleSchemas/wizard/schema.json';
import wizardUi from '../../vue-json-form/src/exampleSchemas/wizard/ui.json';
import reproduceSchema from '../../vue-json-form/src/exampleSchemas/reproduce/schema.json';
import reproduceUi from '../../vue-json-form/src/exampleSchemas/reproduce/ui.json';

const schemas = {
    showcase: { schema: showcaseSchema, ui: showcaseUi, label: 'Showcase' },
    wizard: { schema: wizardSchema, ui: wizardUi, label: 'Wizard' },
    summary: {
        schema: summarySchema,
        ui: summaryUi,
        label: 'Summary (webcomponent)',
    },
    reproduce: { schema: reproduceSchema, ui: reproduceUi, label: 'Reproduce' },
} as const;

type SchemaKey = keyof typeof schemas;
type Tab = 'default' | 'ajv' | 'shadow';

const selectedSchemaKey = ref<SchemaKey>('summary');
const activeTab = ref<Tab>('default');
const submitData = ref<{ variant: string; data: unknown } | null>(null);

const currentSchemaStr = computed(() =>
    JSON.stringify(schemas[selectedSchemaKey.value].schema)
);
const currentUiStr = computed(() =>
    JSON.stringify(schemas[selectedSchemaKey.value].ui)
);

function handleSubmit(event: Event, variant: string) {
    const ce = event as CustomEvent;
    submitData.value = { variant, data: ce.detail[0] };
}
</script>

<template>
    <nav class="navbar navbar-dark bg-primary">
        <div class="container">
            <span class="navbar-brand">Vue JSON Form – Webcomponent Dev</span>
        </div>
    </nav>

    <div class="container mt-4">
        <div class="row mb-4">
            <div class="col-md-4">
                <label for="schema-select" class="form-label fw-semibold"
                    >Schema</label
                >
                <select
                    id="schema-select"
                    class="form-select"
                    v-model="selectedSchemaKey"
                >
                    <option
                        v-for="(schema, key) in schemas"
                        :key="key"
                        :value="key"
                    >
                        {{ schema.label }}
                    </option>
                </select>
            </div>
        </div>

        <ul class="nav nav-tabs">
            <li class="nav-item">
                <button
                    class="nav-link"
                    :class="{ active: activeTab === 'default' }"
                    @click="activeTab = 'default'"
                >
                    Default
                </button>
            </li>
            <li class="nav-item">
                <button
                    class="nav-link"
                    :class="{ active: activeTab === 'ajv' }"
                    @click="activeTab = 'ajv'"
                >
                    AJV Validator
                </button>
            </li>
            <li class="nav-item">
                <button
                    class="nav-link"
                    :class="{ active: activeTab === 'shadow' }"
                    @click="activeTab = 'shadow'"
                >
                    Shadow DOM
                </button>
            </li>
        </ul>

        <div class="tab-content p-4 border border-top-0 rounded-bottom mb-4">
            <div v-show="activeTab === 'default'">
                <p class="text-muted small mb-3">
                    <code>&lt;vjf-default&gt;</code> — no validation, light DOM
                </p>
                <vjf-default
                    :json-schema="currentSchemaStr"
                    :ui-schema="currentUiStr"
                    @submit="handleSubmit($event, 'default')"
                />
            </div>

            <div v-show="activeTab === 'ajv'">
                <p class="text-muted small mb-3">
                    <code>&lt;vjf-ajv&gt;</code> — AJV schema validation, light
                    DOM
                </p>
                <vjf-ajv
                    :json-schema="currentSchemaStr"
                    :ui-schema="currentUiStr"
                    @submit="handleSubmit($event, 'ajv')"
                />
            </div>

            <div v-show="activeTab === 'shadow'">
                <p class="text-muted small mb-3">
                    <code>&lt;vjf-shadow&gt;</code> — Shadow DOM (styles
                    encapsulated)
                </p>
                <vjf-shadow
                    :json-schema="currentSchemaStr"
                    :ui-schema="currentUiStr"
                    @submit="handleSubmit($event, 'shadow')"
                />
            </div>
        </div>

        <div v-if="submitData" class="card mb-4">
            <div class="card-header d-flex align-items-center gap-2">
                <strong>Last submitted data</strong>
                <span class="badge bg-secondary">{{ submitData.variant }}</span>
            </div>
            <div class="card-body">
                <pre class="mb-0">{{
                    JSON.stringify(submitData.data, null, 2)
                }}</pre>
            </div>
        </div>
    </div>
</template>
