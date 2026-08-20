# vue-json-forms-builder-webcomponent

The `@educorvi/vue-json-forms-builder-webcomponent` package wraps the [Vue JSON Form Builder](../vue-json-form-builder) in a framework-agnostic [web component](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) (`<vue-json-form-builder>`), which includes all necessary styles, scripts etc., so it can be embedded in any website — it doesn't matter if plain HTMLor a web framework like React, Angular, Nuxt, or others are used.

## Usage

Load the bundle as a module script, then use the custom element:

```html
<script type="module" src="./dist/vue-json-form-builder.js"></script>

<vue-json-form-builder></vue-json-form-builder>
```

### Attributes

| Attribute               | Description                                                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `json-schema`           | Optional initial JSON Schema (JSON string). Imported once; ignored when `collab-url` is set.                                                  |
| `ui-schema`             | Optional initial UI Schema (JSON string, VJF format). Imported once; ignored when `collab-url` is set.                                        |
| `collab-url`            | WebSocket URL of a Hocuspocus collab server to enable realtime collaboration.                                                                 |
| `collab-document-name`  | Document name (= form id in the backend). Defaults to `default-form`.                                                                         |
| `collab-token`          | Auth token for the collab websocket: a Keycloak access token or an API key (`fb_...`). Fallback when `kc-*` auth is configured.                |
| `backend-url`           | Base URL of a hosting Nuxt backend (`nuxt-auth-utils`). Session-cookie auth for the collab websocket. See [Authentication](#authentication).   |
| `keycloak-idp-hint`     | `kc_idp_hint` appended to the backend's login URL (session mode only).                                                                        |
| `kc-url`                | Keycloak server base URL, e.g. `https://sso.example.com/`. Required together with `kc-realm`/`kc-client-id` for the keycloak-js login.        |
| `kc-realm`              | Keycloak realm, e.g. `dev`.                                                                                                                   |
| `kc-client-id`          | **Public** Keycloak client id (client authentication OFF, PKCE).                                                                              |
| `kc-idp-hint`           | `kc_idp_hint` — skip the login page and redirect straight to a federated IdP (identity brokering).                                            |
| `kc-silent-check-sso-uri` | Absolute URL of the silent `check-sso` page (defaults to `${location.origin}/silent-check-sso.html` — ship `public/silent-check-sso.html`).  |
| `kc-redirect-uri`       | Absolute URL to return to after login (defaults to the current page URL).                                                                     |

### Events

| Event                    | Payload                                   |
| ------------------------ | ----------------------------------------- |
| `vjfb-change`            | `[jsonSchema: object, uiSchema: object]`  |
| `vjfb-definition-change` | `[definition: object]`                    |

## Example 1 — plain HTML, Keycloak credentials set directly

External embed that logs in against its own Keycloak (public client with PKCE; silent `check-sso`, the hosting page is never navigated). The access token authenticates the collab websocket.

```html
<script type="module" src="./dist/vue-json-form-builder.js"></script>

<vue-json-form-builder
  collab-url="wss://forms.example.com/collab"
  collab-document-name="42"
  kc-url="https://sso.example.com/"
  kc-realm="dev"
  kc-client-id="vueformbuilder-embed"
  kc-idp-hint="external-oidc-example"
  kc-silent-check-sso-uri="https://my-host/silent-check-sso.html"
></vue-json-form-builder>
```

> The hosting backend must accept access tokens from this client
> (`azp = clientId`, see `NUXT_AUTH_ALLOWED_CLIENT_IDS` in the backend) and
> the client's `redirectUris` must include the silent check-sso page and the
> embedding origin.

## Example 2 — Nuxt app (first-party, session auth)

The user is already logged in at the hosting Nuxt app (`nuxt-auth-utils`). The browser's session cookie authenticates the collab websocket — no token, no Keycloak URLs needed. The component only checks the session on mount (`GET <backend-url>/api/_auth/session`).

```html
<vue-json-form-builder
  backend-url="http://localhost:3000"
  collab-url="ws://localhost:1234"
  collab-document-name="42"
></vue-json-form-builder>
```

## Example 3 — local builder (no backend, no collab)

```html
<vue-json-form-builder
  json-schema='{ "type": "object", "properties": { "name": { "type": "string" } } }'
  ui-schema='{ "version": "2.2", "layout": { "type": "VerticalLayout", "elements": [] } }'
></vue-json-form-builder>
```
