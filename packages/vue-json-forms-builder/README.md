# @educorvi/vue-json-forms-builder

Visual form builder for [Vue JSON Form](../vue-json-form). A Vue 3 component that lets users build forms by drag & drop: the canvas renders a live preview of every element, the JSON/UI schema can be exported at any time, and an optional [Hocuspocus](https://hocuspocus.dev) backend enables realtime multi-user editing.

## Installation

```bash
yarn add @educorvi/vue-json-forms-builder
```

## Quick start

The simplest usage — a fully local builder (no backend, no collaboration):

```vue
<script setup lang="ts">
import { ref } from 'vue';
import VueJsonFormBuilder from '@educorvi/vue-json-forms-builder';
import '@educorvi/vue-json-forms-builder/dist/vue-json-form-builder.css';

const definition = ref<object | null>(null);

function onDefinitionChange(def: object) {
    // FormDefinition.toJSON() — the format your backend should persist.
    definition.value = def;
}
</script>

<template>
    <VueJsonFormBuilder @vjfb-definition-change="onDefinitionChange" />
</template>
```

### Props

| Prop             | Type                                    | Description                                                                                                                              |
| ---------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `jsonSchema`     | `string`                                | Optional initial JSON Schema (JSON string). Imported once; ignored when `collab` is set.                                                 |
| `uiSchema`       | `string`                                | Optional initial UI Schema (JSON string, VJF format). Imported once; ignored when `collab` is set.                                       |
| `collab`         | `CollabConfig \| null`                  | Enable realtime collaboration: `{ url, documentName?, token?, user? }` (see below).                                                      |
| `keycloak`       | `KeycloakAuthConfig \| null`            | Keycloak login via keycloak-js (public client, PKCE) for third-party hosts (see below).                                                  |
| `backendUrl`     | `string`                                | Base URL of a hosting Nuxt backend (`nuxt-auth-utils` session) — session-cookie auth for the collab websocket.                            |
| `keycloakIdpHint`| `string`                                | `kc_idp_hint` appended to the backend's login URL (session mode only, e.g. `"external-oidc-example"`).                                   |
| `hideHeader`     | `boolean`                               | Hide the top toolbar (title, export/import buttons, preview toggle).                                                                     |

### Events

| Event                    | Payload                                   | Description                                              |
| ------------------------ | ----------------------------------------- | -------------------------------------------------------- |
| `vjfb-change`            | `[jsonSchema: object, uiSchema: object]`  | Current form as `{json, ui}` schema pair (export format).|
| `vjfb-definition-change` | `[definition: object]`                    | Current form as `FormDefinition.toJSON()` (persisted format). Debounce saves yourself. |

## Authentication & collaboration modes

The builder has three auth modes, selected by which props are present:

| Mode      | Props                                  | Who authenticates the collab websocket                        |
| --------- | -------------------------------------- | ------------------------------------------------------------- |
| `local`   | (none)                                 | no backend at all — the form lives only in the browser        |
| `session` | `backendUrl`                           | the browser's `nuxt-session` cookie (hosting Nuxt app)        |
| `keycloak`| `keycloak`                             | a Keycloak access token obtained via keycloak-js (`check-sso`)|

The `CollabConfig` prop:

```ts
interface CollabConfig {
    /** Hocuspocus WebSocket URL, e.g. "ws://localhost:1234" */
    url: string;
    /** Document name (= form id in the backend). Defaults to "default-form". */
    documentName: string;
    /**
     * Optional auth token: an API key ("fb_...") or a Keycloak access
     * token. When `keycloak` auth is configured the builder uses the
     * token it obtained itself and this is only a fallback.
     */
    token?: string;
}
```

## Example 1 — Nuxt app (first-party, session auth)

This is exactly how `apps/vue-json-forms-builder` embeds the builder (`app/pages/forms/detail.vue`): the user is already logged in via `nuxt-auth-utils`, so only the collab URL is configured — the browser's session cookie authenticates the WebSocket handshake automatically.

```vue
<script setup lang="ts">
import VueJsonFormBuilder, {
    type CollabConfig,
} from '@educorvi/vue-json-forms-builder';

definePageMeta({ middleware: ['authenticated'] });

const runtimeConfig = useRuntimeConfig();

// NUXT_PUBLIC_COLLAB_URL=ws://localhost:1234 (empty = local mode)
const collab = computed<CollabConfig | null>(() => {
    const url = runtimeConfig.public.collabUrl as string | undefined;
    if (!url || !formId) return null;
    return {
        url,
        documentName: String(formId), // form id in the backend
    };
});

const saveTimer = ref<ReturnType<typeof setTimeout> | null>(null);
function onDefinitionChange(definition: object) {
    // Collab mode: the Hocuspocus server persists the synced document
    // itself — skip the manual save.
    if (collab.value) return;
    clearTimeout(saveTimer.value);
    saveTimer.value = setTimeout(() => {
        $orpc.forms.schema.import({
            params: { id: formId },
            body: { definition },
        });
    }, 1000);
}
</script>

<template>
    <VueJsonFormBuilder
        :collab="collab"
        hideHeader
        @vjfb-definition-change="onDefinitionChange"
    />
</template>
```

## Example 2 — external host, Keycloak credentials set directly

For third-party embeds (no Nuxt session) pass a Keycloak `keycloak` config — the builder logs in silently (`check-sso`) and uses the access token for the collab websocket. The hosting backend must accept tokens from this public client (`azp` check, see `NUXT_AUTH_ALLOWED_CLIENT_IDS` in the backend).

```vue
<script setup lang="ts">
import VueJsonFormBuilder from '@educorvi/vue-json-forms-builder';

const collab = {
    url: 'wss://forms.example.com/collab', // Hocuspocus server
    documentName: '42', // = form id in the backend
};

const keycloak = {
    url: 'https://sso.example.com/',
    realm: 'dev',
    clientId: 'vueformbuilder-embed', // PUBLIC client, PKCE
    idpHint: 'external-oidc-example', // optional: skip the login page
    // silentCheckSsoRedirectUri: 'https://my-host/silent-check-sso.html',
    // redirectUri: 'https://my-host/form-builder',
};
</script>

<template>
    <VueJsonFormBuilder :collab="collab" :keycloak="keycloak" />
</template>
```

## Example 3 — bare local builder (no backend)

```vue
<template>
    <VueJsonFormBuilder
        json-schema='{ "type": "object", "properties": { "name": { "type": "string" } } }'
        ui-schema='{ "version": "2.2", "layout": { "type": "VerticalLayout", "elements": [] } }'
    />
</template>
```

## Embedding as a web component

Framework-agnostic embedding (plain HTML, React, Angular, …) is provided by the [`@educorvi/vue-json-forms-builder-webcomponent`](../vue-json-forms-builder-webcomponent) package — see its README for attributes and examples.
