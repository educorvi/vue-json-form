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
    /** Current user id (e.g. Keycloak sub). */
    collabUserId?: string;
    collabUserName?: string;
    collabUserColor?: string;
    /** Auth token for the collab websocket. */
    collabToken?: string;
    /** Base URL of the hosting backend for session check / login. */
    backendUrl?: string;
    /** Keycloak `kc_idp_hint` appended to the login URL. */
    keycloakIdpHint?: string;
}
