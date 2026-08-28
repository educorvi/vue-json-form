<script setup lang="ts">
import { computed } from 'vue';
import '@educorvi/vue-json-forms-builder/dist/vue-json-form-builder.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import exampleJSON from '@educorvi/vue-json-form/src/exampleSchemas/showcase/schema.json';
import exampleUI from '@educorvi/vue-json-form/src/exampleSchemas/showcase/ui.json';

/**
 * Dev/e2e playground for the real <vue-json-form-builder> custom element (registered via the side-effect import of ./main.ce.ts in main.dev.ts —
 * see there). Query params let Playwright drive the same attributes a host page would set, without rebuilding:
 *   ?hideHeader=1
 *   ?jsonSchema=<url-encoded JSON>&uiSchema=<url-encoded JSON>
 *   ?collabUrl=ws://ws.localhost:1234&collabDocumentName=<formId>&backendUrl=...
 *     &kcUrl=...&kcRealm=...&kcClientId=...&kcIdpHint=...
 */
const params = new URLSearchParams(window.location.search);

const hideHeader = computed(() => params.has('hideHeader'));
const jsonSchema = computed(
    () => params.get('jsonSchema') ?? JSON.stringify(exampleJSON)
);
const uiSchema = computed(
    () => params.get('uiSchema') ?? JSON.stringify(exampleUI)
);

const collabUrl = computed(() => params.get('collabUrl') ?? undefined);
const collabDocumentName = computed(
    () => params.get('collabDocumentName') ?? undefined
);
const backendUrl = computed(() => params.get('backendUrl') ?? undefined);
const kcUrl = computed(() => params.get('kcUrl') ?? undefined);
const kcRealm = computed(() => params.get('kcRealm') ?? undefined);
const kcClientId = computed(() => params.get('kcClientId') ?? undefined);
const kcIdpHint = computed(() => params.get('kcIdpHint') ?? undefined);
</script>

<template>
    <vue-json-form-builder
        :json-schema="jsonSchema"
        :ui-schema="uiSchema"
        :hide-header="hideHeader"
        :collab-url="collabUrl"
        :collab-document-name="collabDocumentName"
        :backend-url="backendUrl"
        :kc-url="kcUrl"
        :kc-realm="kcRealm"
        :kc-client-id="kcClientId"
        :kc-idp-hint="kcIdpHint"
    ></vue-json-form-builder>
</template>

<style scoped></style>
