<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue';

import summarySchema from './exampleSchemas/summary/schema.json';
import summaryUi from './exampleSchemas/summary/ui.json';
import showcaseSchema from '../../vue-json-form/src/exampleSchemas/showcase/schema.json';
import showcaseUi from '../../vue-json-form/src/exampleSchemas/showcase/ui.json';
import wizardSchema from '../../vue-json-form/src/exampleSchemas/wizard/schema.json';
import wizardUi from '../../vue-json-form/src/exampleSchemas/wizard/ui.json';
import reproduceSchema from '../../vue-json-form/src/exampleSchemas/reproduce/schema.json';
import reproduceUi from '../../vue-json-form/src/exampleSchemas/reproduce/ui.json';

function createSchemaUrl(schema: unknown) {
    const schemaJson = JSON.stringify(schema);
    if (typeof URL.createObjectURL === 'function') {
        return URL.createObjectURL(
            new Blob([schemaJson], { type: 'application/json' })
        );
    }

    return `data:application/json,${encodeURIComponent(schemaJson)}`;
}

function revokeSchemaUrl(url: string) {
    if (typeof URL.revokeObjectURL === 'function' && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
}

const schemas: Record<
    string,
    {
        schemaUrl?: string;
        uiUrl?: string;
        label: string;
        schema?: unknown;
        ui?: unknown;
    }
> = {
    showcase: {
        schema: showcaseSchema,
        schemaUrl: createSchemaUrl(showcaseSchema),
        ui: showcaseUi,
        uiUrl: createSchemaUrl(showcaseUi),
        label: 'Showcase',
    },
    wizard: {
        schema: wizardSchema,
        schemaUrl: createSchemaUrl(wizardSchema),
        ui: wizardUi,
        uiUrl: createSchemaUrl(wizardUi),
        label: 'Wizard',
    },
    summary: {
        schema: summarySchema,
        schemaUrl: createSchemaUrl(summarySchema),
        ui: summaryUi,
        uiUrl: createSchemaUrl(summaryUi),
        label: 'Summary (webcomponent)',
    },
    reproduce: {
        schema: reproduceSchema,
        schemaUrl: createSchemaUrl(reproduceSchema),
        ui: reproduceUi,
        uiUrl: createSchemaUrl(reproduceUi),
        label: 'Reproduce',
    },
};

type SchemaKey = keyof typeof schemas;
type Tab = 'default' | 'ajv' | 'shadow' | 'url';

const selectedSchemaKey = ref<SchemaKey>('showcase');
const activeTab = ref<Tab>('default');
const submitData = ref<{ variant: string; data: unknown } | null>(null);

const currentSchemaStr = computed(() =>
    JSON.stringify(schemas[selectedSchemaKey.value].schema)
);
const currentUiStr = computed(() =>
    JSON.stringify(schemas[selectedSchemaKey.value].ui)
);
const currentSchemaUrl = computed(
    () => schemas[selectedSchemaKey.value].schemaUrl
);
const currentUiUrl = computed(() => schemas[selectedSchemaKey.value].uiUrl);

onBeforeUnmount(() => {
    for (const schema of Object.values(schemas)) {
        if (schema.schemaUrl) {
            revokeSchemaUrl(schema.schemaUrl);
        }
        if (schema.uiUrl) {
            revokeSchemaUrl(schema.uiUrl);
        }
    }
});

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
                    v-model="selectedSchemaKey"
                    class="form-select"
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
            <li class="nav-item">
                <button
                    class="nav-link"
                    :class="{ active: activeTab === 'url' }"
                    @click="activeTab = 'url'"
                >
                    URL Props
                </button>
            </li>
        </ul>

        <div class="tab-content p-4 border border-top-0 rounded-bottom mb-4">
            <div v-show="activeTab === 'default'">
                <p class="text-muted small mb-3">
                    <code>&lt;vjf-default&gt;</code> — no validation, light DOM
                </p>
                <vjf-default
                    id="default-form"
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
                    id="ajv-form"
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
                    id="shadow-form"
                    :json-schema="currentSchemaStr"
                    :ui-schema="currentUiStr"
                    @submit="handleSubmit($event, 'shadow')"
                />
            </div>

            <div v-show="activeTab === 'url'">
                <p class="text-muted small mb-3">
                    <code>&lt;vjf-default&gt;</code> — schemas loaded through
                    <code>json-schema-url</code> and <code>ui-schema-url</code>
                </p>
                <vjf-default
                    id="url-form"
                    :json-schema-url="currentSchemaUrl"
                    :ui-schema-url="currentUiUrl"
                    @submit="handleSubmit($event, 'url')"
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
