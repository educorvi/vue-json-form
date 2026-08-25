<script setup lang="ts">
import { computed } from 'vue';
import {
    VueJsonFormBuilder,
    type CollabConfig,
    type KeycloakAuthConfig,
} from '@educorvi/vue-json-forms-builder';

/**
 * Thin webcomponent wrapper around VueJsonFormBuilder.
 */
const props = defineProps<{
    hideHeader?: boolean;
    openInBuilder?: boolean;
    jsonSchema?: string;
    uiSchema?: string;
    /** Enable realtime collaboration: ws(s)://host:port of the Hocuspocus server */
    collabUrl?: string;
    collabDocumentName: string;
    /**
     * Auth token for the websocket: a Keycloak access token or an API key
     * ("fb_..."). When keycloak auth is configured (kc-*), the builder
     * obtains its own token via keycloak-js and this value is only a
     * fallback.
     */
    collabToken?: string;
    /**
     * Keycloak login via keycloak-js (PUBLIC client, PKCE) — used when the
     * webcomponent is embedded in a third-party host. `kcUrl`, `kcRealm`
     * and `kcClientId` are required; login runs as a *silent* `check-sso`
     * (hidden iframe, the embedding page is never navigated) with an
     * optional `kcIdpHint` for a seamless federated login. The access
     * token authenticates the collab websocket.
     */
    kcUrl?: string;
    kcRealm?: string;
    kcClientId?: string;
    kcIdpHint?: string;
    kcSilentCheckSsoUri?: string;
    kcRedirectUri?: string;
    /**
     * Fallback: base URL of a hosting backend (a Nuxt app using
     * nuxt-auth-utils), e.g. "http://localhost:3000". The builder checks
     * the session on that backend before rendering; the session cookie
     * authenticates the collab websocket.
     */
    backendUrl?: string;
    /**
     * Keycloak IdP hint (`kc_idp_hint`) appended to the backend's login
     * URL (session mode only), e.g. "external-oidc-example" to skip the
     * login page and redirect straight to the federated identity provider.
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
    };
});

const keycloak = computed<KeycloakAuthConfig | null>(() => {
    if (!props.kcUrl || !props.kcRealm || !props.kcClientId) return null;
    return {
        url: props.kcUrl,
        realm: props.kcRealm,
        clientId: props.kcClientId,
        idpHint: props.kcIdpHint,
        silentCheckSsoRedirectUri: props.kcSilentCheckSsoUri,
        redirectUri: props.kcRedirectUri,
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
        :hide-header="hideHeader"
        :open-in-builder="openInBuilder"
        :json-schema="jsonSchema"
        :ui-schema="uiSchema"
        :collab="collab"
        :keycloak="keycloak"
        :backend-url="backendUrl"
        :keycloak-idp-hint="keycloakIdpHint"
        @vjfb-change="handleVJFBChange"
        @vjfb-definition-change="handleVJFBDefinitionChange"
    ></VueJsonFormBuilder>
</template>

<style scoped></style>
