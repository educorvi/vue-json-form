<script setup lang="ts">
import { computed } from 'vue';
import {
    VueJsonFormBuilder,
    type CollabConfig,
} from '@educorvi/vue-json-form-builder';

/**
 * Thin webcomponent wrapper around VueJsonFormBuilder.
 *
 * All logic lives in the Vue component (@educorvi/vue-json-form-builder,
 * src/App.vue) — including the authentication flow against a hosting
 * backend (`backendUrl` / `keycloakIdpHint`). This wrapper only translates
 * webcomponent attributes into props and forwards events.
 */
const props = defineProps<{
    jsonSchema?: string;
    uiSchema?: string;
    /** Enable realtime collaboration: ws(s)://host:port of the Hocuspocus server */
    collabUrl?: string;
    /** Document name (= form id in the backend). Defaults to "default-form". */
    collabDocumentName?: string;
    /** Current user id (e.g. Keycloak sub). Required for awareness. */
    collabUserId?: string;
    collabUserName?: string;
    collabUserColor?: string;
    /**
     * Auth token for the websocket: a Keycloak access token or an API key
     * ("fb_..."). When `backend-url` is set, the auth flow obtains its own
     * token through the login popup and this value is only a fallback.
     */
    collabToken?: string;
    /**
     * Base URL of a hosting backend (a Nuxt app using nuxt-auth-utils),
     * e.g. "http://localhost:3000" — forwarded to the Vue component, which
     * checks the session on that backend before rendering and redirects to
     * its login if needed.
     */
    backendUrl?: string;
    /**
     * Keycloak IdP hint (`kc_idp_hint`) appended to the login URL, e.g.
     * "customer-oidc-example" to skip the login page and redirect straight
     * to the federated identity provider. Only used when `backendUrl` is
     * set and the user is not logged in.
     */
    keycloakIdpHint?: string;
}>();

const emit = defineEmits<{
    'vjfb-change': [jsonSchema: object, uiSchema: object];
    'vjfb-definition-change': [definition: object];
}>();

const collab = computed<CollabConfig | null>(() => {
    if (!props.collabUrl) return null;
    return {
        url: props.collabUrl,
        documentName: props.collabDocumentName,
        token: props.collabToken,
        user:
            props.collabUserId && props.collabUserName
                ? {
                      id: props.collabUserId,
                      name: props.collabUserName,
                      color: props.collabUserColor,
                  }
                : undefined,
    };
});

function handleVJFBChange(jsonSchema: object, uiSchema: object) {
    emit('vjfb-change', jsonSchema, uiSchema);
}

function handleVJFBDefinitionChange(definition: object) {
    emit('vjfb-definition-change', definition);
}
</script>

<template>
    <VueJsonFormBuilder
        :json-schema="jsonSchema"
        :ui-schema="uiSchema"
        :collab="collab"
        :backend-url="backendUrl"
        :keycloak-idp-hint="keycloakIdpHint"
        @vjfb-change="handleVJFBChange"
        @vjfb-definition-change="handleVJFBDefinitionChange"
    ></VueJsonFormBuilder>
</template>

<style scoped></style>
