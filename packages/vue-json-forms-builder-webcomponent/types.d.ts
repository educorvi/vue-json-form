/**
 * Type declarations for the `@educorvi/vue-json-forms-builder-webcomponent`
 * package.
 *
 * The ES bundle (`dist/vue-json-form-builder.js`) is a side-effect module
 * that registers the `<vue-json-form-builder>` custom element via
 * `customElements.define()`. This declaration prevents TypeScript from
 * type-checking the (large) minified bundle itself.
 */
export {};

declare global {
    interface HTMLElementTagNameMap {
        'vue-json-form-builder': VueJsonFormBuilderElement;
    }
}

/** The `<vue-json-form-builder>` custom element (all props are strings). */
export interface VueJsonFormBuilderElement extends HTMLElement {
    /** The form's JSON Schema as a JSON string. */
    jsonSchema?: string;
    /** The form's UI Schema as a JSON string (VJF format). */
    uiSchema?: string;
    /** WebSocket URL of a Hocuspocus collab server. */
    collabUrl?: string;
    /** Document name (= form id in the backend). */
    collabDocumentName?: string;
    /** Auth token for the collab websocket. */
    collabToken?: string;
    /**
     * Keycloak login via keycloak-js (public client, PKCE) — used when
     * the webcomponent runs embedded in a third-party host. Requires
     * `kcUrl`, `kcRealm` and `kcClientId`.
     */
    kcUrl?: string;
    /** Keycloak realm name (with kcUrl/kcClientId). */
    kcRealm?: string;
    /** Public Keycloak client id (client authentication OFF, PKCE). */
    kcClientId?: string;
    /** `kc_idp_hint` — skip the login page, go straight to a federated IdP. */
    kcIdpHint?: string;
    /** Absolute URL of the silent check-sso page (default: <origin>/silent-check-sso.html). */
    kcSilentCheckSsoUri?: string;
    /** Absolute URL to return to after login (default: current page). */
    kcRedirectUri?: string;
    /**
     * Fallback: base URL of the hosting backend (nuxt-auth-utils session).
     * The session cookie authenticates the collab websocket.
     */
    backendUrl?: string;
    /** Keycloak `kc_idp_hint` appended to the backend login URL (with backendUrl). */
    keycloakIdpHint?: string;
}
